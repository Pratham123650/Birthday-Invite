export const approvedGuests = [
  { key: "mahesh-patel", name: "Mahesh Patel", firstName: "Mahesh", lastName: "Patel" },
  { key: "vacant-patel", name: "Vacant Patel", firstName: "Vacant", lastName: "Patel" },
  { key: "kavita-desai", name: "Kavita Desai", firstName: "Kavita", lastName: "Desai" },
  { key: "jagdish-patel", name: "Jagdish Patel", firstName: "Jagdish", lastName: "Patel" },
  { key: "suresh-patel", name: "Suresh Patel", firstName: "Suresh", lastName: "Patel" },
  { key: "manisha-patel", name: "Manisha Patel", firstName: "Manisha", lastName: "Patel" },
  { key: "bijal-patel", name: "Bijal Patel", firstName: "Bijal", lastName: "Patel" },
] as const;

export type ApprovedGuest = (typeof approvedGuests)[number];
export type ApprovedGuestName = ApprovedGuest["name"];

export function findApprovedGuest(name: string) {
  return approvedGuests.find((guest) => guest.name === name);
}

export function isApprovedGuestName(name: string): name is ApprovedGuestName {
  return approvedGuests.some((guest) => guest.name === name);
}
