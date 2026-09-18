const tarolo = document.getElementById("container");

function ReceptekIde() {
    var receptek = [
        {
            id: 1,
            title: "Töltött káposzta",
            difficulty: "Közepes",
            hozzavalok: [
                "1 kg savanyú káposzta",
                "8 közepes db káposztalevél (savanyú)",
                "0.5 kg darált sertéshús",
                "20 dkg kolozsvári szalonna",
                "20 dkg kolbász",
                "1 közepes db vöröshagyma",
                "20 dkg rizs (főtt)",
                "2 gerezd fokhagyma",
                "3 teáskanál fűszerpaprika",
                "1 teáskanál őrölt fűszerkömény",
                "5 db babérlevél",
                "1 evőkanál finomliszt",
                "1 ek sertészsír",
                "2 l víz (kb.)",
                "só ízlés szerint"
            ],
            lepesek: [
                "A kolozsvári szalonnát csíkokra vágjuk, és száraz serpenyőben kisütjük.",
                "A kisült zsírban megpirítjuk a hagymát és a fokhagymát.",
                "Összekeverjük a darált húst, rizst, hagymát, fűszereket és a szalonnát 1 dl vízzel.",
                "A savanyú káposzta felét az edény aljára tesszük babérlevéllel és kolbásszal.",
                "A káposztalevelekbe töltjük a húst, és az edénybe rétegezzük.",
                "Felöntjük vízzel, és kis lángon 2 órán át főzzük.",
                "Zsírból, lisztből és fűszerpaprikából rántást készítünk, majd a káposztára öntjük."
            ],
            image_path: ["toltott_kaposzta.jpg"]
        }
    ];

    for (let index = 0; index < receptek.length; index++) {
        var doboz = document.createElement('div');
        var kep = document.createElement('div');
        var cim = document.createElement('div');
        var nehezseg = document.createElement('span');

        //kep.innerHTML = receptek[index].kepek.length > 0 
        //    ? `<img src="${receptek[index].kepek[0]}" alt="${receptek[index].nev}">` 
        //    : '';
            
        cim.innerHTML = receptek[index].nev;
        nehezseg.innerHTML = receptek[index].nehezseg || "Átlagos";

        cim.appendChild(nehezseg);
        doboz.appendChild(kep);
        doboz.appendChild(cim);

        tarolo.appendChild(doboz);
    }
}

ReceptekIde();