let recipes = [];

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
            const response = await fetch('/.netlify/functions/get-recipes');
            recipes = await response.json();
            localStorage.setItem('recipes_data', JSON.stringify(recipes));
            renderRecipes(recipes);
        } catch (error) {
            console.error('Hiba a receptek betöltésekor:', error);
            renderRecipes([]);
        }
    }
}

function renderRecipes(recipeList = recipes) {
    const container = document.getElementById('container');
    if (!container) return;

    if (!Array.isArray(recipeList) || recipeList.length === 0) {
        container.innerHTML = '<p style="padding:20px; text-align:center;">Nincsenek megjeleníthető receptek.</p>';
        return;
    }

    container.innerHTML = recipeList.map(recipe => {
        const imageSrc = (recipe.image_path && recipe.image_path.trim() !== "") 
            ? recipe.image_path 
            : 'https://images.unsplash.com/photo-1495521821757-a1efb6729352?auto=format&fit=crop&w=600&q=80';

        return `
            <article class="recipe-card-item">
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
                        ⏱️ Előkészítés: ${recipe.prep_time_minutes || 0} perc  <br> 🍳 Sütés/Főzés: ${recipe.cook_time_minutes || 0} perc  <br> 🍽️ ${recipe.servings || 1} adag
                    </div>
                </div>
            </article>
        `;
    }).join('');
}

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

loadRecipes();