export const sjdmDistricts = [
  {
    name: "District 1",
    barangays: [
      "Poblacion",
      "Poblacion I",
      "San Pedro",
      "San Martin de Porres",
      "San Roque",
      "Santo Cristo",
    ],
  },
  {
    name: "District 2",
    barangays: [
      "Gumaoc Central",
      "Gumaoc East",
      "Gumaoc West",
      "Graceville",
      "Tungkong Mangga",
      "San Isidro",
    ],
  },
  {
    name: "District 3",
    barangays: [
      "Francisco Homes-Guijo",
      "Francisco Homes-Mulawin",
      "Francisco Homes-Narra",
      "Francisco Homes-Yakal",
      "Ciudad Real",
      "Kaybanban",
    ],
  },
  {
    name: "District 4",
    barangays: [
      "Muzon East",
      "Muzon Proper",
      "Muzon South",
      "Muzon West",
      "Gaya-Gaya",
      "Maharlika",
    ],
  },
  {
    name: "District 5",
    barangays: [
      "Minuyan",
      "Minuyan II",
      "Minuyan III",
      "Minuyan IV",
      "Minuyan V",
      "Minuyan Proper",
    ],
  },
  {
    name: "District 6",
    barangays: [
      "Bagong Buhay",
      "Bagong Buhay II",
      "Bagong Buhay III",
      "Citrus",
      "Dulong Bayan",
      "Sapang Palay",
    ],
  },
  {
    name: "District 7",
    barangays: [
      "Assumption",
      "Fatima",
      "Fatima II",
      "Fatima III",
      "Fatima IV",
      "Fatima V",
    ],
  },
  {
    name: "District 8",
    barangays: [
      "Kaypian",
      "Lawang Pari",
      "San Martin",
      "San Martin II",
      "San Martin III",
      "San Martin IV",
    ],
  },
  {
    name: "District 9",
    barangays: [
      "San Rafael I",
      "San Rafael II",
      "San Rafael III",
      "San Rafael IV",
      "San Rafael V",
      "Santa Cruz",
      "Santa Cruz II",
      "Santa Cruz III",
      "Santa Cruz IV",
      "Santa Cruz V",
    ],
  },
  {
    name: "District 10",
    barangays: [
      "Paradise III",
      "San Manuel",
      "Santo Niño",
      "Santo Niño II",
    ],
  },
];

export const sjdmBarangays = sjdmDistricts.flatMap((district) =>
  district.barangays.map((barangay) => ({
    district: district.name,
    barangay,
  }))
);
