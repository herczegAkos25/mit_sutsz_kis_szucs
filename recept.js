let recipes = [];

// 1. Receptek betöltése
async function loadRecipes() {
    const savedRecipes = localStorage.getItem('recipes_data');
    
    if (savedRecipes) {
        recipes = JSON.parse(savedRecipes);
        renderRecipes(recipes);
    } else {
        try {
            const response = await fetch('receptek.json');
            recipes = await response.json();
            localStorage.setItem('recipes_data', JSON.stringify(recipes));
            renderRecipes(recipes);
        } catch (error) {
            console.error('Hiba a receptek betöltésekor:', error);
        }
    }
}

// 2. Receptek megjelenítése a kártyákon
function renderRecipes(recipeList = recipes) {
    const container = document.getElementById('container');
    if (!container) return;

    if (!recipeList || recipeList.length === 0) {
        container.innerHTML = '<p>Nincsenek megjeleníthető receptek.</p>';
        return;
    }

    container.innerHTML = recipeList.map(recipe => {
        const imageSrc = recipe.image_path ? recipe.image_path : 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&w=600&q=80';

        return `
            <article class="recipe-card">
                <div class="recipe-image-wrapper">
                    <img src="${imageSrc}" alt="${recipe.title}" class="recipe-image" onerror="this.src='https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&w=600&q=80'">
                </div>
                <div class="recipe-content">
                    <h2>${recipe.title}</h2>
                    <div class="recipe-meta">
                        <span>🏷️ ${recipe.category}</span> | 
                        <span>🌍 ${recipe.cuisine}</span> | 
                        <span>📊 ${recipe.difficulty}</span>
                    </div>
                    <p class="recipe-desc">${recipe.description}</p>
                    <div class="recipe-times">
                        ⏱️ Előkészítés: ${recipe.prep_time_minutes} perc | 🍳 Sütés/Főzés: ${recipe.cook_time_minutes} perc | 🍽️ ${recipe.servings} adag
                    </div>
                </div>
            </article>
        `;
    }).join('');
}

// 3. Modális ablak kezelése
const modal = document.getElementById('recipeModal');
const openModalBtn = document.getElementById('openModalBtn');
const closeModalBtn = document.getElementById('closeModalBtn');

if (openModalBtn) openModalBtn.onclick = () => modal.style.display = 'block';
if (closeModalBtn) closeModalBtn.onclick = () => modal.style.display = 'none';

window.onclick = (event) => {
    if (event.target === modal) {
        modal.style.display = 'none';
    }
};

// SEGÉDFÜGGVÉNY: Képfájl beolvasása Base64 szöveggé
function readImageFile(file) {
    return new Promise((resolve, reject) => {
        if (!file) {
            resolve("");
            return;
        }
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
    });
}

// 4. Új recept mentése az űrlapról (KÉPFELTÖLTÉSSEL)
document.getElementById('recipeForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    // Hozzávalók feldolgozása
    const ingredientsRaw = document.getElementById('ingredients').value.split('\n');
    const items = ingredientsRaw
        .filter(line => line.trim() !== '')
        .map(line => {
            const parts = line.split(',');
            return {
                name: parts[0] ? parts[0].trim() : '',
                amount: parts[1] ? parseFloat(parts[1].trim()) || null : null,
                unit: parts[2] ? parts[2].trim() : ''
            };
        });

    // Lépések feldolgozása
    const instructionsRaw = document.getElementById('instructions').value.split('\n');
    const steps = instructionsRaw.filter(line => line.trim() !== '');

    // Kép beolvasása (ha tölttél fel fájlt)
    const imageInput = document.getElementById('image_file');
    let imageBase64 = "";
    if (imageInput && imageInput.files.length > 0) {
        try {
            imageBase64 = await readImageFile(imageInput.files[0]);
        } catch (err) {
            console.error("Hiba a kép beolvasásakor:", err);
        }
    }

    const titleVal = document.getElementById('title').value;
    
    // Új recept objektum
    const newRecipe = {
        id: titleVal.toLowerCase().replace(/[^a-z0-9áéiíoóöőuúüű]/g, '-'),
        title: titleVal,
        description: document.getElementById('description').value,
        category: document.getElementById('category').value,
        cuisine: document.getElementById('cuisine').value,
        prep_time_minutes: parseInt(document.getElementById('prep_time').value) || 0,
        cook_time_minutes: parseInt(document.getElementById('cook_time').value) || 0,
        servings: parseInt(document.getElementById('servings').value) || 1,
        difficulty: document.getElementById('difficulty').value,
        tags: [],
        image_path: imageBase64, // Beolvasott kép mentése
        ingredients: [
            {
                group: "Alaphozzávalók",
                items: items
            }
        ],
        instructions: [
            {
                section: "Elkészítés",
                steps: steps
            }
        ]
    };

    recipes.push(newRecipe);
    localStorage.setItem('recipes_data', JSON.stringify(recipes));

    renderRecipes(recipes);
    modal.style.display = 'none';
    this.reset();
});

// 5. Frissített receptek.json letöltése
document.getElementById('downloadJsonBtn').addEventListener('click', () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(recipes, null, 4));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "receptek.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
});

// Kategória menü nyitása / csukása
const categoriesBtn = document.getElementById('categoriesBtn');
const categoryMenu = document.getElementById('categoryMenu');

if (categoriesBtn && categoryMenu) {
    categoriesBtn.addEventListener('click', () => {
        const isHidden = categoryMenu.style.display === 'none';
        categoryMenu.style.display = isHidden ? 'flex' : 'none';
    });
}

// Kategória szerinti szűrés
document.querySelectorAll('.cat-filter-btn').forEach(button => {
    button.addEventListener('click', (e) => {
        document.querySelectorAll('.cat-filter-btn').forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');

        const selectedCategory = e.target.getAttribute('data-category');
        
        if (selectedCategory === 'all') {
            renderRecipes(recipes);
        } else {
            const filtered = recipes.filter(r => r.category === selectedCategory);
            renderRecipes(filtered);
        }
    });
});

// Indítás betöltéskor
loadRecipes();