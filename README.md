## Carousel

Конструктор простых объектов-каруселей (слайдеров). Это *учебный* проект.

#### Создание:
```html

<link rel="stylesheet" href="css/carousel.css">
<script src="js/carousel.js"></script>

	<div class="test-carousel-example">
		<div>1</div>
		<div>2</div>
		<div>3</div>
	</div> <!-- test-carousel-example -->


<script>
	const exampleCarousel = new Carousel({ root: document.querySelector(".test-carousel-example") });  // Объект оptions отвечает за параметры работы и отображения карусели (должен обязательно содержать свойство root)
</script>
```

#### Параметры (свойства объекта options):
  * **root**<br>
    Тип: `Object`<br>
    Описание: Ссылка на родительский DOM-элемент, в котором содержатся слайды.<br>
    Значение по умолчанию: `отсутствует`
  * **outerClass**<br>
    Тип: `String`<br>
    Описание: Имя класса для обертки слайдера для дальнешей стилизации через CSS или получения в JavaScript не трогая исходный код.<br>
    Значение по умолчанию: `отсутствует`
  * **draggable**<br>
    Тип: `Boolean`<br>
    Описание: Определяет, можно ли сдвигать слайды мышкой через Drag'n'Drop.<br>
    Значение по умолчанию: `true`
  * **items**<br>
    Тип: `Object`<br>
    Описание: Объект, отвечающий за параметры элементов карусели.<br>
    Значение по умолчанию: ` { itemClassName: "" }`<br>
    Свойства объекта:
      * `String` **itemClassName** - Произвольное имя класса для слайда для дальнешей стилизации через CSS или получения в JavaScript не трогая исходный код.<br>
  * **nav**<br>
    Тип: `Object`<br>
    Описание: Объект, отвечающий за отображения навигации карусели.<br>
    Значение по умолчанию: ` { display: true, nextClassName: "", prevClassName: "", textNext: "nextItem", textPrev: "prevItem" }`<br>
    Свойства объекта:
      * `Boolean` **display** - Параметр, который определяет, отображать ли навигацию.<br>
      * `String` **nextClassName** - Произвольное имя класса кнопки, которая показывает следующий слайд для дальнешей стилизации через CSS или получения в JavaScript не трогая исходный код.<br>
      * `String` **prevClassName** - Произвольное имя класса кнопки, которая показывает предыдущий слайд для дальнешей стилизации через CSS или получения в JavaScript не трогая исходный код.<br>
      * `String` **textNext** - Текст кнопки, которая показывает следующий слайд.<br>
      * `String` **textPrev** - Текст кнопки, которая показывает предыдущий слайд.<br>
  * **dots**<br>
    Тип: `Object`<br> 
    Описание: Объект, отвечающий за отображения точек для управления слайдером.<br>
    Значение по умолчанию: ` { display: true, dotClassName: "" }`<br>
    Свойства объекта:
      * `Boolean` **display** - Параметр, который определяет, отображать ли тчки.<br>
      * `String` **dotClassName** - Произвольное имя класса для точки для дальнешей стилизации через CSS или получения в JavaScript не трогая исходный код.<br>
