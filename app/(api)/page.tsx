export default async function getCustomers() {
    const res = await fetch('https://localhost:7190/Customers');
    if (!res.ok) throw new Error('Failed to fetch customers')
    return res.json();
}
