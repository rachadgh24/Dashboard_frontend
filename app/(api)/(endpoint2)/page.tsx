export default async function getCustomer(id: string) {
    const res = await fetch(`https://localhost:7190/Customers/${id}`);
    if (!res.ok) throw new Error('Failed to fetch customer')
    return res.json();
}
