export const getdecentralization = async (apikey, searchTerm) => {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_STSHOP_ADMIN_API}/admin?q=${searchTerm}`,
      {
        headers: {
          "X-Api-Key": apikey,
        },
      }
    );

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Registration error:", error);
  }
};
