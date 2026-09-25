const uploadModal = document.getElementById('uploadModal');
const openUploadBtn = document.getElementById('openUploadBtn');
const recipeForm = document.getElementById('recipeForm');

if (openUploadBtn) {
    openUploadBtn.addEventListener('click', (e) => {
        e.preventDefault();
        uploadModal.style.display = 'flex';
    });
}

// Esemenylistenzo a form bekuldesere
if (recipeForm) {
    recipeForm.addEventListener('submit', handleFormSubmit);
}

function closeUploadModal() {
    uploadModal.style.display = 'none';
}

window.addEventListener('click', (event) => {
    if (event.target === uploadModal) {
        closeUploadModal();
    }
});

function addIngredientRow() {
    const container = document.getElementById('ingredientsContainer');
    const row = document.createElement('div');
    row.className = 'dynamic-row';
    row.innerHTML = `
        <input type="text" placeholder="Mennyiség (pl. 1)" style="flex: 1;">
        <input type="text" placeholder="Egység (pl. tk, csipet)" style="flex: 1;">
        <input type="text" placeholder="Hozzávaló neve" style="flex: 2;">
        <button type="button" class="btn btn-danger" onclick="removeRow(this)" title="Törlés"><i class="fa-solid fa-trash"></i></button>
    `;
    container.appendChild(row);
}

function removeRow(button) {
    const container = document.getElementById('ingredientsContainer');
    if (container.children.length > 1) {
        button.parentElement.remove();
    } else {
        alert('Legalább 1 hozzávaló megadása kötelező!');
    }
}

function addStepRow() {
    const container = document.getElementById('stepsContainer');
    const stepNum = container.children.length + 1;
    const row = document.createElement('div');
    row.className = 'dynamic-row';
    row.innerHTML = `
        <textarea rows="2" placeholder="${stepNum}. lépés leírása..."></textarea>
        <button type="button" class="btn btn-danger" onclick="removeStep(this)" title="Törlés"><i class="fa-solid fa-trash"></i></button>
    `;
    container.appendChild(row);
}

function removeStep(button) {
    const container = document.getElementById('stepsContainer');
    if (container.children.length > 1) {
        button.parentElement.remove();
        updateStepPlaceholders();
    } else {
        alert('Legalább 1 lépés megadása kötelező!');
    }
}

function updateStepPlaceholders() {
    const steps = document.querySelectorAll('#stepsContainer textarea');
    steps.forEach((step, index) => {
        step.placeholder = `${index + 1}. lépés leírása...`;
    });
}

function previewImage(event) {
    const file = event.target.files[0];
    const preview = document.getElementById('imagePreview');

    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            preview.src = e.target.result;
            preview.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
}

// Segedfuggveny a kep Base64-re alakitasahoz
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

async function handleFormSubmit(event) {
    event.preventDefault();

    const ingredientRows = document.querySelectorAll('#ingredientsContainer .dynamic-row');
    const items = [];
    ingredientRows.forEach(row => {
        const inputs = row.querySelectorAll('input');
        if (inputs[2] && inputs[2].value.trim() !== '') {
            items.push({
                amount: parseFloat(inputs[0].value) || null,
                unit: inputs[1].value.trim(),
                name: inputs[2].value.trim()
            });
        }
    });

    const stepTextareas = document.querySelectorAll('#stepsContainer textarea');
    const steps = [];
    stepTextareas.forEach(textarea => {
        if (textarea.value.trim() !== '') {
            steps.push(textarea.value.trim());
        }
    });

    const imageInput = document.getElementById('imageInput');
    let imageBase64 = "";
    if (imageInput && imageInput.files.length > 0) {
        try {
            imageBase64 = await readImageFile(imageInput.files[0]);
        } catch (err) {
            console.error("Hiba a kép beolvasásakor:", err);
        }
    }

    const titleVal = document.getElementById('recipeTitle').value;
    const categorySelect = document.getElementById('category');

    const newRecipe = {
        id: Date.now().toString(),
        title: titleVal,
        description: `${titleVal} finom receptje.`,
        category: categorySelect.value,
        cuisine: "Magyar",
        prep_time_minutes: parseInt(document.getElementById('prepTime').value) || 0,
        cook_time_minutes: 0,
        servings: parseInt(document.getElementById('servings').value) || 1,
        difficulty: document.getElementById('difficulty').value,
        tags: [],
        image_path: imageBase64,
        ingredients: [{ group: "Hozzávalók", items: items }],
        instructions: [{ section: "Elkészítés", steps: steps }]
    };

    try {
        const response = await fetch('/.netlify/functions/add-recipe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newRecipe)
        });

        const result = await response.json();

        if (response.ok) {
            localStorage.removeItem('recipes_data');
            
            if (typeof loadRecipes === 'function') {
                loadRecipes();
            }

            closeUploadModal();
            document.getElementById('successModal').style.display = 'flex';
        } else {
            alert('Hiba történt a mentés során: ' + (result.error || 'Ismeretlen hiba'));
        }
    } catch (err) {
        console.error('Hálózati hiba a mentéskor:', err);
        alert('Hálózati hiba történt a recept mentése közben!');
    }
}

function closeSuccessModal() {
    document.getElementById('successModal').style.display = 'none';
    document.getElementById('recipeForm').reset();
    const preview = document.getElementById('imagePreview');
    if (preview) {
        preview.src = '';
        preview.style.display = 'none';
    }
}