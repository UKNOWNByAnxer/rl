// Helper class
class Complemento {
    constructor(name, price, img) {
        this.name = name;
        this.price = price;
        this.img = img || ''; // Si no se proporciona img, asigna una cadena vacía
    }
}

// Modal Component
const Modal = {
    props: ['product', 'index'],
    template: 
        `<div class="modal">
            <div class="modal-content">
                <h2>Personaliza {{ product.name }}</h2>
                <div class="category-filter">
                    <select v-model="selectedCategory" class="category-select">
                        <option value="">Todas Las categorías</option>
                        <option v-for="category in categories" :key="category" :value="category">
                        {{ category }}
                        </option>
                    </select>
                </div>
                <div class="grid-container">
                    <div>
                        <h3>Complementos Disponibles:</h3>
                        <ul class="complement-list available-complements">
                            <li v-for="complement in filteredComplements" :key="complement.id"
                                :class="{ 'draggable-item disabled cursor-not-allowed': !isCompatible(complement), 'draggable-item': isCompatible(complement) }"
                                :data-id="complement.id"
                                :data-compatible="isCompatible(complement)">
                                {{ complement.name }} - {{ complement.price | currency }}
                            </li>
                        </ul>
                    </div>
                    <div>
                        <h3>Complementos seleccionados:</h3>
                        <ul class="complement-list selected-complements">
                            <li v-for="complement in selectedComplements" :key="complement.id" 
                                class="draggable-item" 
                                :data-id="complement.id">
                                {{ complement.name }} - {{ complement.price | currency }}
                            </li>
                        </ul>
                    </div>
                </div>
                <p class="total-price">Precio Total: {{ totalPrice | currency }}</p>
                <div class="button-container">
                    <button @click="confirmSelection" class="button confirm">Confirm</button>
                    <button @click="closeModal" class="button cancel">Cancel</button>
                </div>
            </div>
        </div>`,
    data() {
        return {
            availableComplements: this.transformComplements(),
            selectedComplements: [],
            selectedCategory: '',
            categories: ['acompañantes', 'frutas', 'untables', 'toppings']
        };
    },
    methods: {
        transformComplements() {
            const categories = {
                acompañantes: 'RSencillos',
                frutas: 'RSencillos',
                untables: 'RSencillos',
                toppings: 'RSencillos'
            };
            
            let idCounter = 5; 
            const transformedComplements = [];

            Object.entries(this.$root.complementos).forEach(([category, items]) => {
                items.forEach(item => {
                    transformedComplements.push({
                        id: idCounter++,
                        name: item.name,
                        price: item.price,
                        img: item.img,
                        tipo: categories[category],
                        category: category
                    });
                });
            });
            return transformedComplements;
        },
        isCompatible(complement) {
            return complement.tipo === this.product.tipo || complement.tipo === 'al gusto';
        },
        closeModal() {
            this.$emit('close');
        },
        confirmSelection() {
            const updatedProduct = {
                ...this.product,
                complementos: this.selectedComplements
            };
            this.$emit('confirm', updatedProduct);
            this.$emit('update:product', updatedProduct);
        }
    },
    computed: {
        totalPrice() {
            return this.product.price + this.selectedComplements.reduce((total, comp) => total + comp.price, 0);
        },
        filteredComplements() {
            if (!this.selectedCategory) {
                return this.availableComplements;
            }
            return this.availableComplements.filter(complement => complement.category === this.selectedCategory);
        }
    },
    mounted() {
        this.$nextTick(() => {
            const available = this.$el.querySelector('.available-complements');
            const selected = this.$el.querySelector('.selected-complements');

            if (available && selected) {
                new Sortable(available, {
                    group: { name: 'complements', pull: 'clone' },
                    animation: 150,
                    filter: '.cursor-not-allowed',
                    onStart: (evt) => {
                        if (evt.item.dataset.compatible === 'false') {
                            evt.cancel();
                        }
                    },
                    onEnd: (evt) => {
                        if (evt.to === selected && evt.item.dataset.compatible === 'true') {
                            const complementId = parseInt(evt.item.dataset.id);
                            const complement = this.availableComplements.find(c => c.id === complementId);
                            if (!this.selectedComplements.some(c => c.id === complementId)) {
                                this.selectedComplements.push({ ...complement });
                            }
                            evt.item.parentNode.removeChild(evt.item);
                        }
                    }
                });

                new Sortable(selected, {
                    group: 'complements',
                    animation: 150,
                    onEnd: (evt) => {
                        if (evt.to === available) {
                            const complementId = parseInt(evt.item.dataset.id);
                            this.selectedComplements = this.selectedComplements.filter(c => c.id !== complementId);
                            evt.item.parentNode.removeChild(evt.item);
                        }
                    }
                });
            }
        });
    }
};


const ShopItem = {
    template: `
    <div class="row">
        <img :src="imageSrc" alt="Product Image">
        <h3>{{ productName }}</h3>
        <p>{{ productDescription }}</p>
        <div class="in-text">
            <div class="price">
                <h6>{{ price }}</h6>
            </div>
            <div class="s-btn">
                <a @click="$emit('open-modal', { name: productName, price, tipo: productTipo })">Order Now</a>
            </div>
        </div>
        <div class="top-icon">
            <a href="#"><i class="bx bx-heart"></i></a>
        </div>
    </div>
    `,
    props: ['imageSrc', 'productName', 'productDescription', 'price', 'productTipo']
};


const CardProduct = {
    template: `
    <div :id="'product-' + (index + 1)" :style="productStyle" @drop="onDrop($event, item)" @dragover.prevent>
        <div>
            <div class="button" @click="$emit('remove-from-cart')"><i class="bx bx-x"></i></div>
            <img :src="item.image" alt="product image">
            <h3>{{ item.name }}</h3>
            <p>&dollar;{{ item.price }}</p>
            <div v-if="item.complementos.length" class="complementos">
                <h4>Complementos:</h4>
                <ul>
                    <li v-for="(complemento, index) in item.complementos" :key="index">
                        <img :src="complemento.img" :alt="complemento.name">
                        {{ complemento.name }} - &dollar;{{ complemento.price }}
                    </li>
                </ul>
            </div>
        </div>
    </div>
    `,
    props: ['item', 'index']
};

const ReviewItem = {
    template: `
    <div class="box">
        <p>{{ reviewText }}</p>
        <div class="in-box">
            <div class="bx-img">
                <img :src="reviewerImage">
            </div>
            <div class="bxx-text">
                <h4>{{ reviewerName }}</h4>
                <h5>{{ reviewerJob }}</h5>
                <div class="ratings">
                    <a href="#" v-for="_ in 5" :key="_"><i class="bx bxs-star"></i></a>
                </div>
            </div>
        </div>
    </div>
    `,
    props: ['reviewText', 'reviewerImage', 'reviewerName', 'reviewerJob']
};

// Main Vue application
const app = Vue.createApp({
    data() {
        return {
            form: { name: '', email: '', message: '' },
            isModalOpen: false,
            selectedProduct: null,
            cart: [],
            products: [
                { image: 'img/p1.png', name: 'CH 2 Rollitos', description: 'Sencillos, 1 ingrediente', price: 40, tipo: "RSencillos"},
                { image: 'img/p2.png', name: 'GDE 3 Rollitos', description: 'Sencillos, 1 ingrediente', price: 55, tipo: "RSencillos"},
                { image: 'img/p3.png', name: 'CH 2 Rollitos', description: 'Clásicos, 2 ingredientes', price: 45, tipo: "RClásicos"},
                { image: 'img/p4.png', name: 'GDE 3 Rollitos', description: 'Clásicos, 2 ingredientes', price: 65, tipo: "RClásicos"},
                { image: 'img/p5.png', name: 'CH 2 Rollitos', description: 'Especiales, 3 ingredientes', price: 50, tipo: "REspeciales"},
                { image: 'img/p6.png', name: 'GDE 3 Rollitos', description: 'Especiales, 3 ingredientes', price: 70, tipo: "REspeciales"},
                { image: 'img/p7.png', name: 'CH 2 Rollitos', description: 'Elige tus rollitos con una combinación diferente', price: 55, tipo: "Al gusto"},
                { image: 'img/p8.png', name: 'GDE 3 Rollitos', description: 'Elige tus rollitos con una combinación diferente', price: 75, tipo: "Al gusto"},
            ],
            complementos: {
                acompañantes: [new Complemento("Lechera", 5.3, "./img/lechera.webp"), new Complemento("Hershey's", 7), new Complemento("Miel Maple", 6)],
                frutas: [new Complemento('Fresa', 3), new Complemento('Durazno en almíbar', 4), new Complemento('Platano', 3)],
                untables: [new Complemento('Crema beso de ángel', 5), new Complemento('Crema de pistache', 6), new Complemento('Nutella', 7)],
                toppings: [new Complemento('Coco', 2), new Complemento('Nuez', 3), new Complemento('Chispitas de chocolate', 2)]
            },
            fresas_fruta: [ 
                { image: 'img/p9.png', name: 'Fresas Y Fruta Con Crema (CH)', description: 'Incluye 2 toppings', price: 40, tipo:"RSencillos" },
                { image: 'img/p10.png', name: 'Fresas Y Fruta Con Crema (MED)', description: 'Incluye 2 toppings', price: 50, tipo:"RSencillos" },
                { image: 'img/p11.png', name: 'Fresas Y Fruta Con Crema (GDE)', description: 'Incluye 2 toppings', price: 65, tipo:"RSencillos" },
                { image: 'img/p12.png', name: 'Fresas Y Fruta Con Crema (EX. GDE)', description: 'Incluye 2 toppings', price: 85, tipo:"RSencillos" },
                { image: 'img/p13.png', name: 'Fresas Y Fruta Con Crema (LITRO)', description: 'Incluye 2 toppings', price: 125, tipo:"RSencillos" }
            ],         
            platanos_machos_etc: [
                { image: 'img/p14.png', name: 'Plátanos Machos Sencillos', description: 'Incluye lechera y canela', price: 40 },
                { image: 'img/p15.png', name: 'Plátanos Machos Especiales', description: 'Incluye mermeladas o crema de la casa', price: 50 },
                { image: 'img/p16.png', name: 'Gelatina con Rompope y Nuez', description: 'Deliciosa gelatina con rompope y nuez', price: 35 },
                { image: 'img/p17.png', name: 'Gelatina Sencilla', description: 'Sencilla pero deliciosa', price: 25 }
            ],
            esquimos: [
                { image: 'img/p18.png', name: 'Esquimo de Fresa', description: 'Refrescante y delicioso', price: 35 },
                { image: 'img/p19.png', name: 'Esquimo de Chocolate', description: 'Chocolate cremoso', price: 35 },
                { image: 'img/p20.png', name: 'Esquimo de Rompope', description: 'Rompope con un toque especial', price: 35 },
                { image: 'img/p21.png', name: 'Esquimo de Café', description: 'Café en su forma más deliciosa', price: 35 },
                { image: 'img/p22.png', name: 'Esquimo de Baileys', description: 'El clásico Baileys en versión esquimo', price: 45 }
            ], 
            btnText: 'Send Message',
            selectedCategory: 'rollos',
            categories: [
                { value: 'all', label: 'Todos los productos' },
                { value: 'rollos', label: 'Rollos' },
                { value: 'platanos', label: 'Plátanos' },
                { value: 'esquimos', label: 'Esquimos' },
                { value: 'fresas', label: 'Fresas y fruta'}
            ],
            modalSearchQuery: '',
        };
    },
    components: { ShopItem, ReviewItem, CardProduct, Modal },
    mounted() {
        this.initializeScrollEffects();
    },
    async(){},
    computed: {
        filteredProducts() {
            if (this.selectedCategory === 'all') {
                return [...this.products, ...this.fresas_fruta, ...this.platanos_machos_etc, ...this.esquimos];
            }
            
            let filteredList = [];
            switch(this.selectedCategory) {
                case 'rollos':
                    filteredList = this.products.filter(product => product.tipo && product.tipo.includes('R'));
                    break;
                case 'platanos':
                    filteredList = this.platanos_machos_etc.filter(product => product.name.toLowerCase().includes('plátano'));
                    break;
                case 'esquimos':
                    filteredList = this.esquimos;
                    break;
                case 'fresas':
                    filteredList = this.fresas_fruta
                    break
            }
            return filteredList;
        },
        filteredComplements() {
            if (!this.modalSearchQuery) {
                return this.transformComplements();
            }
            const query = this.modalSearchQuery.toLowerCase();
            return this.transformComplements().filter(complement => 
                complement.name.toLowerCase().includes(query)
            );
        },
        totalPrice() {
            return this.cart.reduce((total, product) => {
                // Use product.price instead of product.new_price
                let totalPriceProduct = product.price;
                
                // Check if there are complementos and add their prices
                if (product.complementos && product.complementos.length > 0) {
                    totalPriceProduct += product.complementos.reduce((sum, complemento) => sum + complemento.price, 0);
                }
                
                // Add this product's total price to the total cart price
                return total + totalPriceProduct;
            }, 0);
        }
    },
    methods: {
        transformComplements() {
            const categories = {
                acompañantes: 'RSencillos',
                frutas: 'RSencillos',
                untables: 'RSencillos',
                toppings: 'RSencillos'
            };
            
            let idCounter = 5; 
            const transformedComplements = [];

            Object.entries(this.$root.complementos).forEach(([category, items]) => {
                items.forEach(item => {
                    transformedComplements.push({
                        id: idCounter++,
                        name: item.name,
                        price: item.price,
                        img: item.img,
                        tipo: categories[category]
                    });
                });
            });
            return transformedComplements;
        },
        openModal(product) {
            // Combinar todas las colecciones en un solo array temporal
            const allItems = [
                ...this.products,
                ...this.fresas_fruta,
                ...this.platanos_machos_etc,
                ...this.esquimos
            ];
        
            // Buscar el producto en el array combinado
            const fullProduct = allItems.find(p => p.name === product.name && p.price === product.price);
            
            // Si el producto existe, usarlo, si no, proporcionar una imagen por defecto
            if (fullProduct) {
                this.selectedProduct = { ...fullProduct };
            } else {
                this.selectedProduct = { ...product, image: 'default-image.png' };
            }
        
            // Mostrar el producto en el modal
            console.log(this.selectedProduct);
            this.modalSearchQuery = '';
            this.isModalOpen = true;
        },
        closeModal() {
            this.isModalOpen = false;
            this.selectedProduct = null;
        },
        addToCart(product) {
            this.cart.push(product);
            this.closeModal();
        },
        removeFromCart(index) {
            this.cart.splice(index, 1);
        },
        clearCart() {
            this.cart = [];
        },
        onDragStart(event, complemento) {
            event.dataTransfer.setData('complemento', JSON.stringify(complemento));
        },
        checkout() {
            const formData = this.validateFormData();
            if (formData) {
                this.sendOrder(formData);
            }
        },
        validateFormData() {
            const { Nombre, Metodo, Telefono, confirmar, Fecha } = this.getFormData();
            if (!Metodo) {
                this.showError("You must select a payment method");
                return null;
            }
            if (!Nombre || !Telefono || !Fecha) {
                this.showError("You must enter all the data");
                return null;
            }
            if (confirmar !== Telefono) {
                this.showError("The phone numbers do not match");
                return null;
            }
            return { Nombre, Metodo, Telefono, Fecha };
        },
        getFormData() {
            return {
                Nombre: document.getElementById("Nombre").value,
                Metodo: document.getElementById("Metodo").value,
                Telefono: document.getElementById("telefono").value,
                confirmar: document.getElementById("confirmar").value,
                Fecha: document.getElementById("Fecha").value
            };
        },
        sendOrder(formData) {
            const mensaje = this.formatOrderMessage(formData);
            document.getElementById("enviar").innerHTML = `<div class="loader"></div>`;
            sendMessage(mensaje);
        },
        formatOrderMessage(formData) {
            let mensaje = `Hola, quiero realizar un pedido a nombre de ${formData.Nombre} con los siguientes productos y complementos:`;
            this.cart.forEach(product => {
                mensaje += `\n\n${product.name} - ${product.price} pesos`;
                mensaje += `\nComplementos:`;
                product.complementos?.forEach(comp => {
                    if (comp.name != undefined) {
                        mensaje += `\n- ${comp.name}`
                    };
                });
                mensaje += `\n- ${product.acompañante}`;
            });
            mensaje += `\n\nTotal a pagar: ${this.totalPrice} pesos`;
            mensaje += `\n\nEl método de pago será por medio de: ${formData.Metodo}.`;
            mensaje += `\nPasaré por mi pedido el ${formData.Fecha}. Gracias por su servicio.`;
            mensaje += `\n\nTeléfono de contacto: ${formData.Telefono}`;
            return mensaje;
        },
        showError(message) {
            Swal.fire({
                icon: "error",
                title: "Oops...",
                text: message,
            });
        },
        initializeScrollEffects() {
            const header = document.querySelector("header");
            const menu = document.getElementById("menu-icon");
            const navlist = document.querySelector(".navlist");

            window.addEventListener("scroll", () => {
                header.classList.toggle("sticky", window.scrollY > 0);
            });

            menu.onclick = () => {
                menu.classList.toggle('bx-x');
                navlist.classList.toggle('open');
            };

            window.onscroll = () => {
                menu.classList.remove('bx-x');
                navlist.classList.remove('open');
            };

            document.querySelectorAll(".nav-list a").forEach(link => {
                link.addEventListener("click", () => {
                    navlist.classList.toggle('active');
                });
            });

            this.initializeScrollReveal();
        },
        initializeScrollReveal() {
            const sr = ScrollReveal({
                origin: "top",
                distance: "85px",
                duration: 2500,
                reset: true
            });

            const elements = [
                { selector: ".home-text", delay: 300 },
                { selector: ".home-img", delay: 400 },
                { selector: ".container", delay: 400 },
                { selector: ".about-img", delay: 400 },
                { selector: ".about-text", delay: 300 },
                { selector: ".middle-text", delay: 300 },
                { selector: ".empty-cart", delay: 300, origin: "bottom" },
                { selector: ".row-btn, .shop-content", delay: 300 },
                { selector: ".card ,.review-content, .contact-form, .category-filter", delay: 300 }
            ];

            elements.forEach(el => {
                sr.reveal(el.selector, { delay: el.delay, origin: el.origin || "top" });
            });
        }
    }
});

// Mount Vue application
const vueInstance = app.mount('#app');
window.vueApp = vueInstance;

// Send message function
const sendMessage = async (mensaje) => {
    try {
        const response = await fetch('/send', {
            method: 'POST',
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: mensaje })
        });

        const data = await response.json();

        if (response.ok) {
            Swal.fire({
                icon: "success",
                title: "¡Pedido enviado!",
                text: data.message || "Pedido enviado correctamente",
                didClose: () => {
                    window.vueApp.clearCart();
                }
            });
        } else {
            throw new Error(data.error || 'Error al confirmar el pedido');
        }
    } catch (error) {
        Swal.fire({
            icon: "error",
            title: "Oops...",
            text: error.message,
        });
    } finally {
        document.getElementById("enviar").innerHTML = `<button type="button" @click="checkout">Submit</button>`;
    }
};
