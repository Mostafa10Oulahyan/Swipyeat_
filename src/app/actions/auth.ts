"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function loginAction(formData: FormData) {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const supabase = await createClient();

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        return { success: false, error: error.message };
    }

    // Fetch user's restaurant to redirect correctly
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
        const { data: userData } = await supabase
            .from('users')
            .select('*, restaurant:restaurants(slug)')
            .eq('id', user.id)
            .single();

        if (userData?.restaurant?.slug) {
            return { success: true, redirectUrl: `/dashboard/${userData.restaurant.slug}` };
        }
    }

    return { success: true, redirectUrl: "/dashboard" }; // Fallback
}

export async function logoutAction() {
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/login");
}
