export const approvedGuests = [
  { key: "mahesh-patel", name: "Mahesh Patel", firstName: "Mahesh", lastName: "Patel" },
  { key: "vacant-patel", name: "Vacant Patel", firstName: "Vacant", lastName: "Patel" },
  { key: "kavita-desai", name: "Kavita Desai", firstName: "Kavita", lastName: "Desai" },
  { key: "jagdish-patel", name: "Jagdish Patel", firstName: "Jagdish", lastName: "Patel" },
  { key: "suresh-patel", name: "Suresh Patel", firstName: "Suresh", lastName: "Patel" },
  { key: "manisha-patel", name: "Manisha Patel", firstName: "Manisha", lastName: "Patel" },
  { key: "bijal-patel", name: "Bijal Patel", firstName: "Bijal", lastName: "Patel" },
  { key: "satishbhai-patel", name: "Satishbhai Patel", firstName: "Satishbhai", lastName: "Patel" },
  { key: "kokilaben-patel", name: "Kokilaben Patel", firstName: "Kokilaben", lastName: "Patel" },
  { key: "dilipbhai-patel", name: "Dilipbhai Patel", firstName: "Dilipbhai", lastName: "Patel" },
  { key: "bhavna-patel", name: "Bhavna Patel", firstName: "Bhavna", lastName: "Patel" },
  { key: "hitesh-patel", name: "Hitesh Patel", firstName: "Hitesh", lastName: "Patel" },
  { key: "hasmukhbhai-patel", name: "Hasmukhbhai Patel", firstName: "Hasmukhbhai", lastName: "Patel" },
  { key: "kanchanbhai-patel", name: "Kanchanbhai Patel", firstName: "Kanchanbhai", lastName: "Patel" },
  { key: "purvi-patel", name: "Purvi Patel", firstName: "Purvi", lastName: "Patel" },
] as const;

export type ApprovedGuest = (typeof approvedGuests)[number];
export type ApprovedGuestName = ApprovedGuest["name"];

export function findApprovedGuest(name: string) {
  return approvedGuests.find((guest) => guest.name === name);
}

export function isApprovedGuestName(name: string): name is ApprovedGuestName {
  return approvedGuests.some((guest) => guest.name === name);
}
