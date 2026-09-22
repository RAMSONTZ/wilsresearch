import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../../../lib/supabase/server";
import { createSupabaseAdminClient } from "../../../../../lib/supabase/admin";

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const serverClient = await createSupabaseServerClient();
  const { data: { user } } = await serverClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile } = await serverClient.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Admin access required" }, { status: 403 });

  const { id } = await context.params;
  const admin = createSupabaseAdminClient();
  const { data: booking, error: bookingError } = await admin.from("bookings").select("id, client_id").eq("id", id).single();
  if (bookingError || !booking) return NextResponse.json({ error: bookingError?.message || "Project not found" }, { status: 404 });

  const { count: otherProjectCount, error: countError } = await admin
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("client_id", booking.client_id)
    .neq("id", id);
  if (countError) return NextResponse.json({ error: `Could not check the client's other projects: ${countError.message}` }, { status: 500 });

  for (const bucket of ["client-files", "payment-receipts", "deliverables"]) {
    const { data: files, error: listError } = await admin.storage.from(bucket).list(id);
    if (listError) return NextResponse.json({ error: `Could not inspect ${bucket}: ${listError.message}` }, { status: 500 });
    if (files?.length) {
      const { error: removeError } = await admin.storage.from(bucket).remove(files.map((file) => `${id}/${file.name}`));
      if (removeError) return NextResponse.json({ error: `Could not remove ${bucket} files: ${removeError.message}` }, { status: 500 });
    }
  }

  const { error: deleteBookingError } = await admin.from("bookings").delete().eq("id", id);
  if (deleteBookingError) return NextResponse.json({ error: deleteBookingError.message }, { status: 500 });

  if ((otherProjectCount || 0) > 0) {
    return NextResponse.json({ deleted: true, accountDeleted: false, message: "Project deleted. The client account was kept because it still owns other projects." });
  }

  const { error: deleteUserError } = await admin.auth.admin.deleteUser(booking.client_id);
  if (deleteUserError) return NextResponse.json({ error: `Project deleted, but client Auth account could not be deleted: ${deleteUserError.message}` }, { status: 500 });

  return NextResponse.json({ deleted: true });
}