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
                alert('At alábbi mezőt nem törölheted: Legalább 1 hozzávaló megadása kötelező!');
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
                alert('At alábbi mezőt nem törölheted: Legalább 1 lépés megadása kötelező!');
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
                reader.onload = function(e) {
                    preview.src = e.target.result;
                    preview.style.display = 'block';
                };
                reader.readAsDataURL(file);
            }
        }
                function handleFormSubmit(event) {
            event.preventDefault();
            document.getElementById('successModal').style.display = 'flex';
        }

        function closeModal() {
            document.getElementById('successModal').style.display = 'none';
            document.getElementById('recipeForm').reset();
            const preview = document.getElementById('imagePreview');
            preview.src = '';
            preview.style.display = 'none';
        }