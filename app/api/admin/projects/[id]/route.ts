import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../../../lib/supabase/server";
import { createSupabaseAdminClient } from "../../../../../lib/supabase/admin";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const serverClient = await createSupabaseServerClient();
    const { data: { user } } = await serverClient.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: profile } = await serverClient.from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role !== "admin") return NextResponse.json({ error: "Admin access required" }, { status: 403 });

    const { id } = await context.params;
    const admin = createSupabaseAdminClient();

    // 1. Fetch the target project to determine who the client is
    const { data: booking, error: bookingError } = await admin.from("bookings").select("id, client_id").eq("id", id).single();
    if (bookingError || !booking) return NextResponse.json({ error: bookingError?.message || "Project not found" }, { status: 404 });

    // 2. Look up all projects assigned to this client
    const { data: clientBookings, error: clientBookingsError } = await admin
      .from("bookings")
      .select("id")
      .eq("client_id", booking.client_id);
    if (clientBookingsError) return NextResponse.json({ error: `Could not find the client's projects: ${clientBookingsError.message}` }, { status: 500 });

    // 3. Clear storage buckets for all of the client's projects
    const buckets = ["client-files", "payment-receipts", "deliverables"];
    for (const bucket of buckets) {
      for (const clientBooking of clientBookings || []) {
        const { data: files, error: listError } = await admin.storage.from(bucket).list(clientBooking.id);
        if (listError) return NextResponse.json({ error: `Could not inspect ${bucket}: ${listError.message}` }, { status: 500 });
        
        if (files?.length) {
          const { error: removeError } = await admin.storage.from(bucket).remove(files.map((file) => `${clientBooking.id}/${file.name}`));
          if (removeError) return NextResponse.json({ error: `Could not remove ${bucket} files: ${removeError.message}` }, { status: 500 });
        }
      }
    }

    // 4. Delete all database project records for this client
    const { error: deleteBookingsError } = await admin.from("bookings").delete().eq("client_id", booking.client_id);
    if (deleteBookingsError) return NextResponse.json({ error: `Could not delete the client's projects: ${deleteBookingsError.message}` }, { status: 500 });

    // 5. Delete the database user profile record
    const { error: deleteProfileError } = await admin.from("profiles").delete().eq("id", booking.client_id);
    if (deleteProfileError) return NextResponse.json({ error: `Projects deleted, but client profile record could not be deleted: ${deleteProfileError.message}` }, { status: 500 });

    // 6. Permanently drop the core Auth user account
    const { error: deleteUserError } = await admin.auth.admin.deleteUser(booking.client_id);
    if (deleteUserError) return NextResponse.json({ error: `Projects and profile deleted, but client Auth account could not be deleted: ${deleteUserError.message}` }, { status: 500 });

    return NextResponse.json({ 
      deleted: true, 
      accountDeleted: true, 
      deletedProjectCount: clientBookings?.length || 0 
    });

  } catch (error) {
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Unexpected account deletion error. Check SUPABASE_SERVICE_ROLE_KEY." 
    }, { status: 500 });
  }
}
