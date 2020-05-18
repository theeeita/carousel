"use strict";

/**
 * @constructor
 * Конструктор слайдеров (каруселей) на основе корневого элемента. Экземпляр класса может содержать
 * пользовательские классы и разные виды элементов управления, не содержать их вовсе или задать их извне, на основе элементов,
 * которые никак не связаны с экземпляром класса.
 * 
 * @param {Object} options Объект с настройками.
 */
function Carousel(options) {
	const {
		root, // Единственный обязательный параметр (контейнер со слайдами).
		outerClass = "",
		draggable = false,
		loop = true,
		duration = 750,
		itemClass = "",

		autoplay = true,
		autoplayDelay = 2000,

		nav = true,
		navClass = "",

		buttons = true,
		buttonsClass = "",
		nextButtonClass = "",
		prevButtonClass = "",
		nextButtonHTML = "nextItem",
		prevButtonHTML = "prevItem",
		
		dots = true,
		dotsClass = "",
		dotItemClass = "",
	} = options || {};

	if(!root) return;

	const $ = this,
				outerElement = createElement("div", { className: `carousel-container${ (outerClass)? ` ${outerClass}` : "" }` }),
				carouselFlow = createElement("div", { className: "carousel" }),
				sizes = {
									width: root.offsetWidth,
									height: root.offsetHeight
								};

	// "Приватные" свойства:
	$._isMoving = false;
	$._movedByDot = false;
	$._isPaused = (autoplay) ? false : true;
	$._browserDelay = (navigator.userAgent.includes("Firefox")) ? 100 : 0; // Фикс для Mozilla (для нее задержка должна быть до 100ms), в Chrome работает и при 0.

	$._autoplayTimerId = null,
	$._autoplayDelay = autoplayDelay;

	$._loop = loop;
	$._duration = duration;
	$._startIndex = 0;
	$._offsetWidth = sizes.width;

	$._items = getElementsArray(root.children);
	$._itemsCount = $._items.length;

	$._storage = createElement("div", { className: "carousel-items-list" } );
	$._controls = {
		active: nav,
		dots: dots
	}

	// Создание "обертки" для слайдера, задание размерности на основе элемента, который был передан в конструкторе.
	// Добавление пользовательских классов (если есть).
	applySizes(sizes, carouselFlow, ...$._items);
	for(const item of $._items) addClasses(item, "carousel-item", itemClass);
	$._items[0].classList.add("active");

	root.insertAdjacentElement("beforeBegin", outerElement);
	outerElement.append(carouselFlow);
	carouselFlow.append(root);
	root.append($._storage);
	$._storage.append(...$._items);

	outerElement.append(carouselFlow);
	outerElement.style.width = `${sizes.width}px`;

	// Добавление элементов управления, если указано их добавить:
	if(nav) {
		const navigation = createElement("div", { className: `carousel-nav${ (navClass)? ` ${navClass}` : "" }` });
		outerElement.append(navigation);

		// Кнопочная навигация:
		if(buttons) {
			const btnsCont = createElement("div", { className: `carousel-buttons${ (buttonsClass) ? ` ${buttonsClass}` : "" }` }),
						btnNext  = createElement("button", { className: `carousel-next${ (nextButtonClass) ? ` ${nextButtonClass}` : "" }`, html: nextButtonHTML, "data-action": "next", }),
						btnPrev  = createElement("button", { className: `carousel-prev${ (prevButtonClass) ? ` ${prevButtonClass}` : "" }`, html	: prevButtonHTML, "data-action": "prev", });
	
			btnsCont.append(btnPrev, btnNext);
			navigation.append(btnsCont);
		}
	
		// Точечная навигация:
		if(dots) {
			const dotsCont = createElement("div", { className: `carousel-dots${ (dotsClass) ? ` ${dotsClass}` : "" }` });
			let start = 0,
					stop  = $._items.length;
			
			while(start < stop) {
				const dot = createElement("span", { className: `carousel-dot-item${ (dotItemClass) ? ` ${dotItemClass}` : "" }`, "data-action": "moveAt", "data-order": start });
				dotsCont.append(dot);
				start++;
			}

			$._dots = getElementsArray(dotsCont.children);
			$._dots[0].classList.add("active");
			navigation.append(dotsCont);
		}

		// Клик по кнопке или точке:
		outerElement.addEventListener("click", function(event) {
			const target = event.target.closest("[data-action]");
			if(target) {
				const action = target.dataset.action;
				(action === "moveAt") ? $[action](+target.dataset.order) : $[action]();
			}
		});
	}

	// Реализация возможности перетаскивать слайды мышкой (если надо):
	if(draggable) {
		outerElement.addEventListener("mousedown", function(event = window.event) {
			event.preventDefault();
			const target = event.target.closest(".carousel-items-list"),
						initialClickPosition = event.pageX;
	
			if(!target) return;
	
			target.addEventListener("mousemove", dragItem);
	
			target.addEventListener("mouseup", function() {
				target.removeEventListener("mousemove", dragItem);
			});
	
			/**
			 * @description Функция, которая двигает слайде при Drag'n'Drop.
			 * 
			 * @param {Object} event Объект события.
			 */
			function dragItem(event) {
				if(initialClickPosition < event.pageX - 35) {
					$.prev();
					target.removeEventListener("mousemove", dragItem);
				}
				if(initialClickPosition > event.pageX + 35) {
					$.next();
					target.removeEventListener("mousemove", dragItem);
				}
			}

		});
	}

	if(autoplay) {
		$.play();
	}
	
}

// Прототип. Содержит в себе публичные и приватные методы работы.
Carousel.prototype = {

	/**
	 * @public @method
	 * Запускает слайдер или возобнавляет его после паузы.
	 */
	play() {
		if(this._autoplayTimerId !== null) return;
		this._isPaused = false;
		this._autoplayTimerId = setTimeout(() => {
			this._autoplayTimerId =	setInterval( this.next.bind(this) , this._autoplayDelay);
		}, 0);
	},

	/**
	 * @public @method
	 * Ставит слайдер на паузу.
	 */
	pause() {
		if(this._isPaused) return;
		clearInterval(this._autoplayTimerId);
		this._autoplayTimerId = null;

		this._isPaused = true;
		this._isMoving = false;
		this._movedByDot = false;
	},

	/**
	 * @public @method
	 * Показывает следующий слайд или первый (если на момент вызова был активен последний элемент и включено зацикливание). При этом выполняет перестановку элементов.
	 * Увеличивает/сбрасывает счетик активного элемента (от 0 до кол-во слайдов - 1).
	 * 
	 * Алгоритм:
	 * 1. Включить переход.
	 * 2. Сдвигает коллекцию элементов на один шаг (ширина одного слайда).
	 * 3. Перемещает (без копирования) первый элемент в конец.
	 * 4. Отключает переход и сбрасывает смещение коллекци до 0.
	 * 5. Отметить ставший первым слайд и точку, соотвествующую счетчику, классом "active".
	 */
	next() {
		if(this._movedByDot || this._isMoving || ((this._startIndex + 1 > this._itemsCount - 1) && !this._loop)) return;

		this._startIndex = (this._startIndex + 1 > this._itemsCount - 1) ? 0 : this._startIndex + 1;
		this._isMoving = true;
		
		this._storage.style.transition = `left ${this._duration / 1000}s ease`;
		this._storage.style.left = `-${this._offsetWidth}px`;

		setTimeout(() => {
			const firstElement = getElementsArray(this._storage.querySelectorAll(".carousel-item"))[0];
			this._storage.append(firstElement);

			this._storage.style.transition = "none";
			this._storage.style.left = "0";

			this._isMoving = false;
			this._pointSlideActive();
		}, this._duration);

		this._pointDotActive(this._startIndex);
	},

	/**
	 * @public @method
	 * Показывает предыдущий слайд или самый последний (если на момент вызова активен был первый и включено зацикливание). При этом выполняет перестановку элементов.
	 * Уменьшает/сбрасывает счетик активного элемента (от 0 до кол-во слайдов - 1).
	 * 
	 * Алгоритм:
	 * 1. Отключить переход.
	 * 2. Скопировать первый (активный элемент), взять последний элемент (без копирования) и добавить их в начало коллекции слайдов, сдвинув ее влево на один шаг (ширина одного слайда), чтобы в области просмотра оказалась копия первого элемента.
	 * 3. Включить переход и сдвинуть слайд на перемещенный с конца слайд (он стал первым).
	 * 4. Удалить копию первого элемента.
	 * 5. Отметить ставший первым слайд и точку, соотвествующую счетчику, классом "active".
	 */
	prev() {
		if(this._movedByDot || this._isMoving || ((this._startIndex - 1 < 0) && !this._loop)) return;

		this._startIndex = ((this._startIndex - 1) < 0) ? this._itemsCount - 1 : this._startIndex - 1;
		this._isMoving = true;

		this._storage.style.transition = "none";
		const lastElement = getElementsArray(this._storage.querySelectorAll(".carousel-item"))[this._itemsCount - 1],
					firstCloned = getElementsArray(this._storage.querySelectorAll(".carousel-item"))[0].cloneNode(true);

		firstCloned.classList.add("clone");
		this._storage.prepend(lastElement, firstCloned);
		this._storage.style.left = `-${this._offsetWidth}px`;
		
		setTimeout(() => {
			this._storage.style.transition = `left ${this._duration / 1000}s ease`;
			firstCloned.remove();
			setTimeout(() => this._storage.style.left = "0", 0);
		}, this._browserDelay);

		setTimeout(() => {
			this._isMoving = false;
			this._pointSlideActive();
		}, this._duration);

		this._pointDotActive(this._startIndex);
	},

	/**
	 * @public @method
	 * Сдвигает слайд, соответствующий указанному номеру в область просмотра, переставляя при этом все остальные слайды, создавая зацикливание.
	 * Устанавливает счетчик элементов.
	 * Алгоритм такой же как и у методов prev/next, с той разницей, что тут копируются или перемещаются не обязательно один элемент, а несколько. И шаг сдвига также отличаается (смотря какой сдвиг).
	 * 
	 * @param {Number} index Номер слайда, который необходимо перенести в область просмотра и сделать активным.
	 */
	moveAt(index) {
		if(this._isMoving || this._movedByDot) return;
		this._movedByDot = true;
		this._storage.style.transition = `left ${this._duration / 1000}s ease`;

		const previous = this._startIndex,
					clicked  = index,
					length   = Math.abs(previous - clicked),
					offset   = this._offsetWidth * length;

		if(previous < clicked) {
			this._storage.style.left = `-${offset}px`;

			setTimeout(() => {
				const before = getElementsArray(this._storage.querySelectorAll(".carousel-item")).slice(0, length);
				this._storage.append(...before);

				this._storage.style.transition = "none";
				this._storage.style.left = "0";

				this._startIndex = clicked;
				this._movedByDot = false;
				this._pointSlideActive();
			}, this._duration);

		}

		if(previous > clicked) {
			this._storage.style.transition = "none";
			const after = getElementsArray(this._storage.querySelectorAll(".carousel-item")).slice(-length),
						firstCloned = getElementsArray(this._storage.querySelectorAll(".carousel-item"))[0].cloneNode(true);

			firstCloned.classList.add("clone");
			this._storage.prepend(...after, firstCloned);
			this._storage.style.left = `-${offset}px`;

			setTimeout(() => {
				this._storage.style.transition = `left ${this._duration / 1000}s ease`;
				firstCloned.remove();
				setTimeout(() => this._storage.style.left = "0", 0);
			}, this._browserDelay);
	
			setTimeout(() => {
				this._startIndex = clicked;
				this._movedByDot = false;
				this._pointSlideActive();
			}, this._duration);
		}

		this._pointDotActive(clicked);
	},

	/**
	 * @private @method
	 * Отмечает точку слайдера, которая соответствует активному слайду (находящемумся в зоне просмотра) классом "active".
	 * 
	 * @param {Number} index Номер слайда, который на данный момент активен.
	 */
	_pointDotActive(index) {
		if(this._controls.active && this._controls.dots) this._dots.forEach((item, i) => (i === index) ? item.classList.add("active") : item.classList.remove("active") );
	},

	/**
	 * @private @method
	 * Отмечает слайд, который сместился в зону просмотра классом "active", убирая этот класс с другого слайда, который скрылся.
	 */
	_pointSlideActive() {
		getElementsArray(this._storage.querySelectorAll(".carousel-item")).forEach((item, i) => (i === 0) ? item.classList.add("active") : item.classList.remove("active") );
	}

}

// Вспомогательные функции:

/**
 * @description Возвращает выборку элементов в виде массива.
 * 
 * @param query CSS-селектор в виде строки или уже готовая HTML коллекция, которую надо преобразовать в массив.
 * @param {Object} context Контекст, в котором будут искаться элементы (если query это селектор). По умолчанию - document.
 */
function getElementsArray(query, context = document) {
	return (typeof query === "string") ? Array.from(context.querySelectorAll(query)) : Array.from(query);
}

/**
 * @description Добавляет класс(ы) элементу, если у них его (их) нет.
 * 
 * @param {Object} element Элемент, к которому будут применены классы.
 * @param classes Классы или классы, которые необходимо применить.
 */
function addClasses(element, ...classes) {
	for(const className of classes) if(className !== "" && className !== undefined && !element.classList.contains(className)) element.classList.add(className);
}

/**
 * @description Применяет размеры к HTML элементу в пикселях.
 * 
 * @param {Object} Объект со размерами вида { width: value, height: value, ... }.
 * @param elements Элемент или элементы, к которым надо применить размеры.
 */
function applySizes(props, ...elements) {
	for(const element of elements) {
		for(const [ name, value ] of Object.entries(props)) {
			element.style[name] = `${value}px`;
		}
	}
}

/**
 * @description Создает новый HTML-элемент с указанными свойстами атрибутами или содержимым.
 * 
 * @param {String} tag HTML-тег нового элемента.
 * @param {Object} props Объект со свойствами/атрибутами вида: { name: value, ... }, может содержать в себе
 * свойство html, которое определяет HTML-содержимое элемента, text - текст внутри элемента и className - класс(ы).
 * А также стандартные атрибуты: alt, title, src, data-* ...
 */
function createElement(tag, props) {
	const element = document.createElement(tag);
	for(const [ name, value ] of Object.entries(props)) {
		switch (name) {
			case "className":
				element.className = value;
				break;
			case "html":
				element.innerHTML = value;
				break;
			case "text":
				element.textContent = value;
				break;
			default:
				element.setAttribute(name, value);
		}
	}

	return element;
}