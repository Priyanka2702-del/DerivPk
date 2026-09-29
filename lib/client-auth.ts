export async function logoutUser(): Promise<boolean> {
  try {
    const response = await fetch("/api/auth/logout", {
      method: "POST",
    });

    if (!response.ok) {
      return false;
    }

    return true;
  } catch (error) {
    console.error("Logout request failed:", error);
    return false;
  }
}