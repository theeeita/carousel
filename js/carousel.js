"use strict";

/**
 * @description Конструктор (класс) объектов, которые являются каруселями (слайдерами).
 *
 * @constructor
 * @param {Object} options Объект с настройками отображения и работы карусели.
 */
function Carousel(options) {
	let {
		root,
		outerClass = "",
		draggable = true,
		items = {
			itemClassName: ""
		},
		nav = {
			display: true,
			nextClassName: "",
			prevClassName: "",
			textNext: "nextItem",
			textPrev: "prevItem"
		},
		dots = {
			display: true,
			dotClassName: ""
		}
	} = options;

	const $ = this,
				main = document.createElement("div"),
				sizes = {
					width: root.offsetWidth,
					height: root.offsetHeight
				};

	addClasses(main, "carousel-container", outerClass);
	root.classList.add("carousel");

	$.items = getElementsArray(root.children).map(item => item);

	(function() { // Создание "обертки" для элементов карусели, добавление кастомных классов к элементам (если они есть).
		const mover = document.createElement("div");
		mover.className = "carousel-items-list";
		for(let item of $.items) addClasses(item, "carousel-item", items.itemClassName);

		mover.append(...$.items);
		root.append(mover);
		root.before(main);
		main.append(root);
	})();

	$.mover = root.firstElementChild;
	$.restart(false);

	adjustSizes(sizes, "px", root, $.items);

	if(getElementsArray($.items).some(item => item.offsetWidth !== 0)) {
		if(nav.display) {
			let navContainer = document.createElement("div"),
					btnNext = document.createElement("button"),
					btnPrev = document.createElement("button");

			btnNext.dataset.action = "next";
			btnPrev.dataset.action = "prev";

			addClasses(btnNext, "carousel-next", nav.nextClassName);
			addClasses(btnPrev, "carousel-prev", nav.prevClassName);

			btnNext.textContent = nav.textNext;
			btnPrev.textContent = nav.textPrev;

			navContainer.className = "carousel-buttons-nav";
			navContainer.append(btnPrev, btnNext);
			root.after(navContainer);
		}
	
		if(dots.display) {
			let dotsContainer = document.createElement("div");
			dotsContainer.className = "carousel-dots-nav";
	
			for(let i = 0; i < $.items.length; i++) {
				let dot = document.createElement("div");
				dot.dataset.action = "dot";
				addClasses(dot, "dot-item", dots.dotClassName);

				dotsContainer.append(dot);
			}
	
			$.dots = dotsContainer.children;
	
			$.dots[0].classList.add("active");
			root.after(dotsContainer);
		}
	}

	$.offsetWidth = root.querySelector(".carousel-item").offsetWidth;
	$.border = $.offsetWidth * ($.items.length - 1);

	// Обработчики:
	main.addEventListener("click", function(event = window.event) {
		let target = event.target;
		let trigger = target.dataset.action;

		switch(trigger) {
			case "next":
				$.next();
				break;
			case "prev":
				$.prev();
				break;
			case "dot":
				$.moveToPosition(event);
				break;
		}

	});

	if(draggable) {
		main.addEventListener("mousedown", function(event = window.event) {
			event.preventDefault();
			let target = event.target.closest(".carousel-items-list"),
					initialClickPosition = event.pageX;

			if(!target) return;

			target.addEventListener("mousemove", dragItem);

			target.addEventListener("mouseup", function() {
				target.removeEventListener("mousemove", dragItem);
			});

			function dragItem(event) {
				if(initialClickPosition < event.pageX - 20) {
					$.next();
					target.removeEventListener("mousemove", dragItem);
				}
				else if(initialClickPosition > event.pageX + 20) {
					$.prev();
					target.removeEventListener("mousemove", dragItem);
				}
			}
		});
	}


};

Carousel.prototype = {

	activeIndex: 0,
	offset: 0,

	restart(doted = false) {
		this.offset = 0;
		this.mover.style.left = `${this.offset}px`;

		for(let item of this.items) item.classList.remove("active");

		(doted) ? getElementsArray(this.dots).forEach(dot => dot.classList.remove("active")) : this.items[0].classList.add("active");
	},

	next() {
		if(Math.abs(this.offset) >= this.border) return false;

		this.offset -= this.offsetWidth;
		this.mover.style.left = `${this.offset}px`;

		this.items[this.activeIndex].classList.remove("active")

		if(this.dots) {
			this.dots[this.activeIndex].classList.remove("active");
			this.dots[this.activeIndex].nextElementSibling.classList.add("active");
		}

		this.items[this.activeIndex].nextElementSibling.classList.add("active");
		this.activeIndex += 1;
	},

	prev() {
		if(this.offset >= 0) return;

		this.offset += this.offsetWidth;
		this.mover.style.left = `${this.offset}px`;

		this.items[this.activeIndex].classList.remove("active");

		if(this.dots) {
			this.dots[this.activeIndex].classList.remove("active");
			this.dots[this.activeIndex].previousElementSibling.classList.add("active");
		}

		this.items[this.activeIndex].previousElementSibling.classList.add("active");
		this.activeIndex -= 1;
	},

	moveToPosition(event) {
		let clicked = event.target.closest(".dot-item");
		
		this.activeIndex = getElementsArray(clicked.parentElement.children).findIndex(item => item === clicked);

		this.restart(true);

		this.offset = -(this.offsetWidth * this.activeIndex);
		this.mover.style.left = `${this.offset}px`;

		this.items[this.activeIndex].classList.add("active");
		this.dots[this.activeIndex].classList.add("active");
	}

};

// Вспомогательные функции:

/**
 * @description Возвращает выборку элементов из HTML-коллекции или по селектору в виде массива.
 *
 * @param {Object} query HTML-коллекция или CSS-селектор.
 * @param {Object} context Контекст, в котором искать элементы (только если поиск по селектору). По умолчанию - document.
 */
function getElementsArray(query, context = document) {
	let elements;

	if(typeof query === "string") {
		elements = Array.from(context.querySelectorAll(query));
	} else elements = Array.from(query);
	
	return elements;
}

/**
 * @description Добавляет к элементу все переданные классы, если их нет.
 *
 * @param {Object} element HTML-элемент.
 * @param {String} classes Список классов через запятую.
 */
function addClasses(element, ...classes) {
	for(let className of classes) {
		if(className === "" || className === undefined || element.classList.contains(className)) continue;
		element.classList.add(className);
	}
}

/**
 * @description Применяет к элементам css размеры в указанных единицах.
 *
 * @param {Object} props Объекта вида { name1: value, name2: value, ... }
 * @param {String} type Единицы, в которых должен быть указан размер.
 * @param {Object} elements Список HTML-элементов через запятую.
 */
function adjustSizes(props, type, ...elements) {
	elements.forEach(elem => {
		if(elem.length > 0) adjustSizes(props, type, ...elem);
		else {
			for(let [ prop, value ] of Object.entries(props)) {
				elem.style[prop] = `${value + type}`;
			}
		}
	});
};