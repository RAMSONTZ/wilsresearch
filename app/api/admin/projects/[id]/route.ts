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

  for (const bucket of ["client-files", "payment-receipts", "deliverables"]) {
    const { data: files } = await admin.storage.from(bucket).list(id);
    if (files?.length) await admin.storage.from(bucket).remove(files.map((file) => `${id}/${file.name}`));
  }

  const { error: deleteBookingError } = await admin.from("bookings").delete().eq("id", id);
  if (deleteBookingError) return NextResponse.json({ error: deleteBookingError.message }, { status: 500 });

  const { error: deleteUserError } = await admin.auth.admin.deleteUser(booking.client_id);
  if (deleteUserError) return NextResponse.json({ error: `Project deleted, but client Auth account could not be deleted: ${deleteUserError.message}` }, { status: 500 });

  return NextResponse.json({ deleted: true });
}