const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Image map extracted from hubt.com.br API - name -> Google image URL
// Adding =s800 for decent resolution
const imageMap = {
  // ENTRADAS
  'Salada Prize': 'https://lh3.googleusercontent.com/jwk_OCWiApB1nV8gg8WUe51GFfGCfx1tIsWlG6TJLdtBfiAZasxHPPnU5CCeJZMJopfhexmC0CcuQJxJgp28sBJS_2JFXbo0mA=s800',
  'Feijão Amigo': 'https://lh3.googleusercontent.com/rtroBVPf6dFtI0TxWcxnPp4H7MUlc5XmRhPrieaaPtitLcQo_Gce_rmHBO6pUDVOb7n7l42Ur8-_6mL6VpgEQz2g0BzLC9AdeQ=s800',
  'Pastel Queijo/Carne': 'https://lh3.googleusercontent.com/zjQXrYTj0WMlftdu7hRTtiBj7B_958QQSPeW4FmNd8dyK8iYNrP3i4VG2Vkr3CjWJ9flur7uOvtu8vUGRtGwnRjdp8IXcCKjsw=s800',

  // SUGESTÕES DO CHEF
  'Medalhão ao Molho Madeira': 'https://lh3.googleusercontent.com/Ul0wyUioo1WfkkkXH2qSheNg4S901mOXoRFWfUGCcMmdeSwQVxDJro5vbsDaH2U4iPA-aV0MKM4tG-KzGjOal8Yu1BKq_PUP=s800',
  'Salmão': 'https://lh3.googleusercontent.com/MUrK_CnrAsCa5co57_Hg-TvGge2vKmpqMoAWdvwbFtBo1dVepdDOpUxj3Xxx8D5046K_cJ3xkNitetB8Iy_HS0_qTSQfjf44zPA=s800',
  'Filé Osvaldo Aranha': 'https://lh3.googleusercontent.com/J5nDwxeMAER3zRfpuiliXYra0VqMKkBfBLePAE-u_ZultyjDIdF3w-MEbseD0sPfXIh7ZBd1QEPAFUFz0uVYq3WoD6FgQw3T=s800',
  'Camarão ao Catupiry': 'https://lh3.googleusercontent.com/JyTwO-ZH2Cf-aOuDQe4F3UUhQBzCQwEiq2TRj9e5K-ONVNSqs34TnQPG5eFeZM4pdWRYXSRFEG9YZqfsYXUxzb62DgrraNzFQw=s800',
  'Filé Parmegiana': 'https://lh3.googleusercontent.com/nE98VzyjYeZlVM0Tt-RjfBYlCvf3gXLi9PWlDqji5Dm-XBj-z2_RpvjsN-jBKhahHfvxyG4MvBy-v-wvolchZPvJSTfN64UITg=s800',
  'Peixe com Molho de Camarão p/2': 'https://lh3.googleusercontent.com/sVYmZIYHkMwnOfaJMTycE6No4TwhCKnr5sdt0vQZIh649Yfpx17FNM5lFEiCr1fo00A24fa008WuSoQC6H6dCR7qjI9lUB2dWQ=s800',
  'Peixe com Fritas p/2': 'https://lh3.googleusercontent.com/sbY9XZiyv6dwRRGnpRz2mZJreyZbOJWY10IZKCY662EiOnWIriP6FdgTnkrcyMQQGiHTB507gsJncrTBtwioO0yq8OCmDgDl6w=s800',

  // GRILL
  'Picanha P/1': 'https://lh3.googleusercontent.com/JSuWBLsi9Y_2SrkjvPfpb1_jZ5eiKgUuVhLTQVxe8RjIqCaKoH4LO6ig9zAGd3F1i0LhPLgaIC0bBkXEV6p3x1bnR8T63st3uaQ=s800',
  'Picanha P/2': 'https://lh3.googleusercontent.com/MJV7ommrDopYif5ahBSpWMCvBhzubq5vGU9MFnntiNbrdwBfwECQfppeg9UkS-CiD3wLrtDq-6aC4OtQFcBWRBC_Ab-6f3HJ9Q=s800',
  'Galeto P/2': 'https://lh3.googleusercontent.com/y9-bQxfkpyXpwDMi5hxixjY-OI3nVmUQEHQJu87vTFWUDo6hMTftQQlyt05JjOqDqJ8akDACT6WzmD1KcS27poDkV3blUDpo=s800',
  'Cupim/Costela': 'https://lh3.googleusercontent.com/47HrjciLBK8_oqksaJnQXJekEQS-JNn3NEv3YTGqPeMF24npxcF_MASq6--vk6t0mb-0_SAhT2bKGuQsu-BFc7RJ3Nksybr-yJA=s800',

  // EXECUTIVOS
  'Frango': 'https://lh3.googleusercontent.com/3SnenVIV6vmhD9lolY86EFSzxLVFmLwJVNFAMt8RRq6zXnQ67u2K-WLfvMMfZms8Bp7FNfw2SZa8AgTEYH4RJy2b4cEKsZYL=s800',
  'Peixe': 'https://lh3.googleusercontent.com/dxzZxglV_l3kz7DQF0CHw_z-tgTuisi2gnkrNA7PqnVohIjZ3fY4NzSf2WfXFxhDiuf47xZAZVbH1mU0cMUwJSZeDtnW-CP0GQ=s800',
  'Contra Filé': 'https://lh3.googleusercontent.com/QsZiXoKoLO67JoJtOSWvjBeXjPz15u2zxRzuHOtBucYpMjzxzqw-QwbdjMsZMrRoCOdnqKUuyA5Ujtyyo1b6jncKmNSDgYO9=s800',
  'Prize Kids': 'https://lh3.googleusercontent.com/9mF4gvzY0KhS7Rn56ujEXdzdaPa-6Oqe4OQ98DpBJood1OzuDoFwgnDrRRHJyykMwJKUKepRM3UNyTt9MZyN0m99PQhgg9zYuQ=s800',

  // PETISCOS
  'Filé Gorgonzola': 'https://lh3.googleusercontent.com/LAv2wvdMzIqw4vWeoMkFfcPaBuJnw4O43QOIFPtRoAoadE0ZRaeKOokPP1KKIGCclo1QhF0wjltXaUcCRAMB1veRK7KSS8vM4Q=s800',
  'Trio do Mar': 'https://lh3.googleusercontent.com/Y-8Qo4yIq5heaY_oDXkg2P5Qd9tSEeinIamLCDKDJCp5vS6_taYQNSH_RFI2NjNqJSPT8EoM4RkSjtA9naNOZaxze7QLNJV6xyE=s800',
  'Batata Frita': 'https://lh3.googleusercontent.com/AcqH5R-N5jnaOBLYzLJgSOHjEZLZ0jY88gDveIyye5-YYhH0nrzvdxAWsIwevMNAj9l3LI1pdAzjFTTERHIby-VcHAl66598AUg=s800',
  'Batata Especial': 'https://lh3.googleusercontent.com/-AzFNLbrIXMwHdyFwrCkfEUQ6B0B-2ic5NMbW5LtmsW76OilSn-lttCgdMvtF1xG-USVOoZlVVlpP3sBa9B0PcCBL2577OcAhJw=s800',
  'Sticks frango': 'https://lh3.googleusercontent.com/frQLgZY7QmbrWJ-x04sIxjAxLH78EcSq_NidVAG6auQ9yf2W2EjdYxHkZKtU2k6kfscxddqd2r7W66rWajZu3mLa1B7hIQqCzg=s800',
  'Loucuras do mar': 'https://lh3.googleusercontent.com/7G3lDQ2BhxkcknP0xwRUP0ugdk4JfS5v3cZefsb5k8nO_cZwmYwmUzxZa5q9S9JOpe7enfS-eEnkRgS1p3syQrl26DwXCpcVqA=s800',
  'Isca peixe': 'https://lh3.googleusercontent.com/uBYtVemS4NLHd5H_NWQiqiSv8xrQMujOhmvHaklVp-VtLD7eK2z2ppKZl-fD8pukWTiraE1d4zRW1vra0NNNffstCfLZecDgrdc=s800',
  'Lula Crocante': 'https://lh3.googleusercontent.com/dYq3j86ts4TOvD-v4sMw9UUZCbgetuXywcgkmlAQr2_TMXPaAkm55h9iHs6CYqX3In_mhMsC2WvQkYAJIjC6evYWZwfDjj8j=s800',

  // SOBREMESAS
  'Brownie com Sorvete': 'https://lh3.googleusercontent.com/NaMHqizniI5k6rNcDovh2TeY2uRD4QxdPZ85CrkZLBDQKG2hrmQsP37LIKtAdxdHCG-oM_ODohPATkbFmBEhnz4hwWDDW5Q17A=s800',

  // PRIZE DRINK'S
  'Aperol Spritz': null,
  'Moscow Mule': null,

  // CERVEJAS
  'Balde Stella Artois (5un)': 'https://lh3.googleusercontent.com/PenaiUjJvnZcGFajVDq-Ghk06JCjA0d4OI2HimYrhSJiUQSS0s75IUHL_GF4-01ed_6ffd4iWiYCxf5BowQLO5lbV_94flLe8Q=s800',
  'Balde Heineken (5un)': 'https://lh3.googleusercontent.com/bosRzqkaoC_LLtQvxXGz7446FGbbJCZ2I9kC83YW1vB05lV_e0XFRIoeIpeVtlETMWk5z728Gaf1QZaPvz5N3GapvXyZH1K6HQ=s800',
  'Heineken LN': 'https://lh3.googleusercontent.com/kzTvftOK_7Q6IYY51jgRDd1gVzmQpO0HZfmivZ3M5Pv1y6RK6j0yZ0M2SgrdC5vbWA2Ll0UfxXQ4S_ttC63tJuksPPVH-ydqMw=s800',
  'Stella Artois LN': 'https://lh3.googleusercontent.com/qMAiEsQFWDEeFmiU0xDwaKyqT8uueTHnIhzrUeaheTmLsEZG08DLERZ4dn9KSFeBQYgdo55mD-nLIwYVsDi2VOqJfUk5l6FK=s800',
  'Corona LN': 'https://lh3.googleusercontent.com/klZ3ae-LnS6Xs6IYYqPEBGt81YK6BSSuj-SaI1qsgOShN531tEQ6hECcHlI_Ma1nPiWOXMsxiPhOGUjnaScrKdRdbZE-hIc3TA=s800',
  'Budweiser LN': null,
  'Brahma 600ml': null,
};

// Normalize function for fuzzy matching
function normalize(s) {
  return s.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

async function main() {
  const items = await prisma.menuItem.findMany();
  let updated = 0;
  let notFound = 0;

  const normalizedMap = {};
  for (const [name, url] of Object.entries(imageMap)) {
    if (url) normalizedMap[normalize(name)] = url;
  }

  for (const item of items) {
    const normalizedName = normalize(item.name);
    let imageUrl = normalizedMap[normalizedName];

    // Try partial matching if exact match fails
    if (!imageUrl) {
      for (const [mapNorm, url] of Object.entries(normalizedMap)) {
        if (normalizedName.includes(mapNorm) || mapNorm.includes(normalizedName)) {
          imageUrl = url;
          break;
        }
      }
    }

    if (imageUrl) {
      await prisma.menuItem.update({
        where: { id: item.id },
        data: { image: imageUrl },
      });
      updated++;
      console.log(`  ✓ ${item.name}`);
    } else {
      notFound++;
      console.log(`  ✗ ${item.name} (sem foto no site)`);
    }
  }

  console.log(`\n✅ ${updated} itens atualizados com foto, ${notFound} sem foto disponível`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
