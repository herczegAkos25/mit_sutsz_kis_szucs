let recipes = [];

// 1. Receptek betöltése
async function loadRecipes() {
    const savedRecipes = localStorage.getItem('recipes_data');
    
    if (savedRecipes) {
        try {
            recipes = JSON.parse(savedRecipes);
        } catch (e) {
            recipes = [];
        }
        renderRecipes(recipes);
    } else {
        try {
            const response = await fetch('receptek.json');
            recipes = await response.json();
            localStorage.setItem('recipes_data', JSON.stringify(recipes));
            renderRecipes(recipes);
        } catch (error) {
            console.error('Hiba a receptek betöltésekor:', error);
            renderRecipes([]);
        }
    }
}

// 2. Receptek megjelenítése (Biztonsági ellentétes ellenőrzéssel a .length hibák elkerülésére)
function renderRecipes(recipeList = recipes) {
    const container = document.getElementById('container');
    if (!container) return;

    // Ha a tömb nem létezik vagy üres, lekezeljük hiba nélkül
    if (!Array.isArray(recipeList) || recipeList.length === 0) {
        container.innerHTML = '<p style="padding:20px; text-align:center;">Nincsenek megjeleníthető receptek.</p>';
        return;
    }

    container.innerHTML = recipeList.map(recipe => {
        // Ha nem létezik a kép vagy hibás a path, automatikusan egy biztonságos fallback képet tölt be
        const imageSrc = (recipe.image_path && recipe.image_path.trim() !== "") 
            ? recipe.image_path 
            : 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&w=600&q=80';

        return `
            <article class="recipe-card">
                <div class="recipe-image-wrapper">
                    <img src="${imageSrc}" alt="${recipe.title || 'Recept'}" class="recipe-image" onerror="this.onerror=null; this.src='https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&w=600&q=80';">
                </div>
                <div class="recipe-content">
                    <h2>${recipe.title || 'Névtelen recept'}</h2>
                    <div class="recipe-meta">
                        <span>🏷️ ${recipe.category || 'Általános'}</span> | 
                        <span>🌍 ${recipe.cuisine || 'Magyar'}</span> | 
                        <span>📊 ${recipe.difficulty || 'könnyű'}</span>
                    </div>
                    <p class="recipe-desc">${recipe.description || ''}</p>
                    <div class="recipe-times">
                        ⏱️ Előkészítés: ${recipe.prep_time_minutes || 0} perc | 🍳 Sütés/Főzés: ${recipe.cook_time_minutes || 0} perc | 🍽️ ${recipe.servings || 1} adag
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

if (openModalBtn && modal) openModalBtn.onclick = () => modal.style.display = 'block';
if (closeModalBtn && modal) closeModalBtn.onclick = () => modal.style.display = 'none';

window.onclick = (event) => {
    if (modal && event.target === modal) {
        modal.style.display = 'none';
    }
};

// Segédfüggvény a kép beolvasásához
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

// 4. Új recept mentése
const recipeForm = document.getElementById('recipeForm');
if (recipeForm) {
    recipeForm.addEventListener('submit', async function(e) {
        e.preventDefault();

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

        const instructionsRaw = document.getElementById('instructions').value.split('\n');
        const steps = instructionsRaw.filter(line => line.trim() !== '');

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
            image_path: imageBase64,
            ingredients: [{ group: "Alaphozzávalók", items: items }],
            instructions: [{ section: "Elkészítés", steps: steps }]
        };

        recipes.push(newRecipe);
        localStorage.setItem('recipes_data', JSON.stringify(recipes));

        renderRecipes(recipes);
        if (modal) modal.style.display = 'none';
        this.reset();
    });
}

// 5. JSON letöltése
const downloadBtn = document.getElementById('downloadJsonBtn');
if (downloadBtn) {
    downloadBtn.addEventListener('click', () => {
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(recipes, null, 4));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute("href", dataStr);
        downloadAnchor.setAttribute("download", "receptek.json");
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
    });
}

// Kategória menü
const categoriesBtn = document.getElementById('categoriesBtn');
const categoryMenu = document.getElementById('categoryMenu');

if (categoriesBtn && categoryMenu) {
    categoriesBtn.addEventListener('click', () => {
        const isHidden = categoryMenu.style.display === 'none';
        categoryMenu.style.display = isHidden ? 'flex' : 'none';
    });
}

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