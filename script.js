document.addEventListener('DOMContentLoaded', () => {
	// Тролль-кнопка на index (оставляем как есть)
	const btn = document.querySelector('.hub-btn');
	if (btn) {
		const messages = [
			'Попробуй ещё раз',
			'Ещё чуть-чуть!',
			'Ух ты, почти!',
			'Не сегодня :)',
			'Думай быстрее!'
		];
		let attempts = 0;
		const maxAttemptsBeforeGo = 6;
		const moveButton = () => {
			btn.style.position = 'fixed';
			btn.style.left = '0';
			btn.style.top = '0';
			const rect = btn.getBoundingClientRect();
			const margin = 16;
			const maxX = Math.max(0, window.innerWidth - rect.width - margin);
			const maxY = Math.max(0, window.innerHeight - rect.height - margin);
			const useCorner = Math.random() < 0.4;
			let x, y;
			if (useCorner) {
				const corners = [
					[margin, margin],
					[maxX, margin],
					[margin, maxY],
					[maxX, maxY]
				];
				[x, y] = corners[Math.floor(Math.random() * corners.length)];
			} else {
				x = Math.floor(Math.random() * maxX);
				y = Math.floor(Math.random() * maxY);
			}
			btn.style.transform = `translate(${x}px, ${y}px)`;
		};
		const handleClick = (e) => {
			e && e.preventDefault();
			attempts += 1;
			btn.textContent = messages[Math.floor(Math.random() * messages.length)];
			moveButton();
			if (attempts >= maxAttemptsBeforeGo) {
				const href = btn.getAttribute('href') || 'hub.html';
				window.location.href = href;
			}
		};
		btn.addEventListener('click', handleClick);
		btn.addEventListener('keydown', (e) => {
			if (e.key === 'Enter' || e.key === ' ') {
				e.preventDefault();
				handleClick(e);
			}
		});
	}

	// --- Hub logic: отметить 4 пазла и открыть финальную дверь ---
	const puzzleButtons = Array.from(document.querySelectorAll('.puzzle-btn'));
	const finalDoor = document.getElementById('finalDoor');
	const TOTAL = 4;
	const storageKey = (n) => `puzzle-${n}`;

	// инициализация состояния из localStorage
	const initHubState = () => {
		let completed = 0;
		puzzleButtons.forEach(btn => {
			const id = btn.getAttribute('data-puzzle');
			if (localStorage.getItem(storageKey(id)) === '1') {
				btn.classList.add('visited');
				btn.style.pointerEvents = 'none';
				btn.style.cursor = 'default';
				completed += 1;
			}
		});
		// вызвать только если есть финальная дверь на странице
		if (finalDoor) updateDoorState(completed);
	};

	// обновить дверь: если все пройдены — разблокировать
	const updateDoorState = (completedCount) => {
		if (!finalDoor) return; // защита: ничего не делаем если нет элемента
		if (completedCount >= TOTAL) {
			finalDoor.classList.remove('locked');
			finalDoor.classList.add('unlocked');
			finalDoor.setAttribute('href', 'final.html');
			finalDoor.setAttribute('aria-disabled', 'false');
		} else {
			finalDoor.classList.add('locked');
			finalDoor.classList.remove('unlocked');
			finalDoor.setAttribute('href', '#');
			finalDoor.setAttribute('aria-disabled', 'true');
		}
	};

	// клик по puzzle — проиграть анимацию открытия, пометить и перейти
	puzzleButtons.forEach(btn => {
		btn.addEventListener('click', (e) => {
			const id = btn.getAttribute('data-puzzle');
			const href = btn.getAttribute('href') || '#';

			// если уже анимируется — игнорируем повторные клики
			if (btn.classList.contains('opening')) {
				e.preventDefault();
				return;
			}

			// короткая анимация открытия, затем пометка и переход
			e.preventDefault();
			btn.classList.add('opening');

			// через ~полсекунды считаем анимацию завершённой
			setTimeout(() => {
				// пометить как пройденное
				localStorage.setItem(storageKey(id), '1');
				btn.classList.add('visited');
				btn.classList.remove('opening');
				btn.classList.add('opened');

				// обновить состояние двери
				const completed = puzzleButtons.filter(b => localStorage.getItem(storageKey(b.getAttribute('data-puzzle'))) === '1').length;
				updateDoorState(completed);

				// перейти на страницу пазла (если нужно)
				window.location.href = href;
			}, 520); // подогнать под CSS transition (≈450ms)
		});
	});

	// сброс прогресса (для разработки) — удержать Ctrl+Shift и клик по двери
	if (finalDoor) {
	finalDoor.addEventListener('click', (e) => {
finalDoor.addEventListener('click', (e) => {
	// dev-сброс
	if (e.ctrlKey && e.shiftKey) {
		for (let i=1;i<=TOTAL;i++) localStorage.removeItem(storageKey(i));
		puzzleButtons.forEach(b=>b.classList.remove('visited'));
		updateDoorState(0);
		alert('Прогресс сброшен (dev).');
		return;
	}

	// анимация тряски для заблокированной двери
	if (finalDoor.classList.contains('locked')) {
		finalDoor.classList.add('shake');
		setTimeout(() => finalDoor.classList.remove('shake'), 500);
	}

	// ❌ ВОТ ЭТО ЛОМАЕТ ВСЁ
	e.preventDefault();
	return;
});

	// функция для отметки прохождения испытания
	window.markPuzzleCompleted = (puzzleNumber) => {
		localStorage.setItem(storageKey(puzzleNumber), '1');
		console.log(`Испытание №${puzzleNumber} пройдено`);
	};

	// инициализация при загрузке
	initHubState();

	// --- Quiz (puzzle1) logic: single-page 15-question test ---
	const quizRoot = document.getElementById('quiz');
	if (quizRoot) {
		const questions = [
			{ text: '1. Как ты принимаешь решения?', choices: [
				{v:'A',t:'Спокойно и обдуманно'},
				{v:'B',t:'Быстро, по ситуации'},
				{v:'C',t:'Как почувствую'},
				{v:'G',t:'Импульсивно, а там разберёмся'}
			]},
			{ text: '2. Твой идеальный подарок?', choices: [
				{v:'A',t:'Полезный и нужный'},
				{v:'B',t:'Практичный и компактный'},
				{v:'C',t:'Необычный и красивый'},
				{v:'G',t:'Смешной и странный'}
			]},
			{ text: '3. Если планы внезапно меняются?', choices: [
				{v:'A',t:'Ничего страшного'},
				{v:'B',t:'Подстроюсь'},
				{v:'C',t:'Даже интересно'},
				{v:'G',t:'Ну и отлично, хаос!'}
			]},
			{ text: '4. Как ты обычно отдыхаешь?', choices: [
				{v:'A',t:'Спокойно'},
				{v:'B',t:'Активно, но недолго'},
				{v:'C',t:'Творчески'},
				{v:'G',t:'Как получится'}
			]},
			{ text: '5. Что тебя больше всего бесит?', choices: [
				{v:'A',t:'Ненадёжность'},
				{v:'B',t:'Медлительность'},
				{v:'C',t:'Скука'},
				{v:'G',t:'Ограничения'}
			]},
			{ text: '6. Твой стиль в одежде?', choices: [
				{v:'A',t:'Удобно и аккуратно'},
				{v:'B',t:'Главное — функционально'},
				{v:'C',t:'Выразительно'},
				{v:'G',t:'Сегодня так, завтра иначе'}
			]},
			{ text: '7. Если что-то сломалось?', choices: [
				{v:'A',t:'Починю'},
				{v:'B',t:'Найду замену'},
				{v:'C',t:'Переделаю по-своему'},
				{v:'G',t:'Ну… бывает'}
			]},
			{ text: '8. Как ты относишься к правилам?', choices: [
				{v:'A',t:'Они нужны'},
				{v:'B',t:'Пока не мешают'},
				{v:'C',t:'Их можно трактовать'},
				{v:'G',t:'Какие правила?'}
			]},
			{ text: '9. Твой любимый вайб?', choices: [
				{v:'A',t:'Уют'},
				{v:'B',t:'Движ'},
				{v:'C',t:'Эстетика'},
				{v:'G',t:'Мемы'}
			]},
			{ text: '10. В компании ты…', choices: [
				{v:'A',t:'Тихая опора'},
				{v:'B',t:'Организатор'},
				{v:'C',t:'Идейный вдохновитель'},
				{v:'G',t:'Источник хаоса'}
			]},
			{ text: '11. Как ты реагируешь на стресс?', choices: [
				{v:'A',t:'Держусь'},
				{v:'B',t:'Действую'},
				{v:'C',t:'Отвлекаюсь'},
				{v:'G',t:'Паникую, но смешно'}
			]},
			{ text: '12. Что для тебя комфорт?', choices: [
				{v:'A',t:'Стабильность'},
				{v:'B',t:'Удобство'},
				{v:'C',t:'Атмосфера'},
				{v:'G',t:'Свобода'}
			]},
			{ text: '13. Если опаздываешь?', choices: [
				{v:'A',t:'Извинюсь'},
				{v:'B',t:'Ускорюсь'},
				{v:'C',t:'Сделаю вид, что так и надо'},
				{v:'G',t:'А я вообще не шла'}
			]},
			{ text: '14. Твоя сильная сторона?', choices: [
				{v:'A',t:'Надёжность'},
				{v:'B',t:'Адаптивность'},
				{v:'C',t:'Креатив'},
				{v:'G',t:'Харизма'}
			]},
			{ text: '15. Что про тебя чаще всего говорят?', choices: [
				{v:'A',t:'«На неё можно положиться»'},
				{v:'B',t:'«Она всегда в движении»'},
				{v:'C',t:'«Она странная, но классная»'},
				{v:'G',t:'«С ней никогда не скучно»'}
			]}
		];

		const results = {
			1: { title: 'Классическая деревянная', text: 'Основа основ. Надёжность 24/7.', img: 'https://github.com/Arsenic337492/New-year-gift/blob/main/images/%D0%A2%D0%B0%D0%B1%D1%83%D1%80%D0%B5%D1%82%D0%BA%D0%B8/%D0%94%D0%B5%D1%80%D0%B5%D0%B2%D1%8F%D0%BD%D0%BD%D0%B0%D1%8F%20%D1%82%D0%B0%D0%B1%D1%83%D1%80%D0%B5%D1%82%D0%BA%D0%B0.jpg?raw=true' },
			2: { title: 'Складная походная', text: 'Всегда готова и всегда не вовремя.', img: 'https://github.com/Arsenic337492/New-year-gift/blob/main/images/%D0%A2%D0%B0%D0%B1%D1%83%D1%80%D0%B5%D1%82%D0%BA%D0%B8/%D0%9F%D0%BE%D1%85%D0%BE%D0%B4%D0%BD%D0%B0%D1%8F%20%D1%82%D0%B0%D0%B1%D1%83%D1%80%D0%B5%D1%82%D0%BA%D0%B0.jpg?raw=true' },
			3: { title: 'Дизайнерская странная', text: 'Никто не понимает, зачем она такая. Кроме тебя.', img: 'https://github.com/Arsenic337492/New-year-gift/blob/main/images/%D0%A2%D0%B0%D0%B1%D1%83%D1%80%D0%B5%D1%82%D0%BA%D0%B8/%D0%94%D0%B8%D0%B7%D0%B0%D0%B9%D0%BD%D0%B5%D1%80%D1%81%D0%BA%D0%B0%D1%8F%20%D1%81%D1%82%D1%80%D0%B0%D0%BD%D0%BD%D0%B0%D1%8F%20%D1%82%D0%B0%D0%B1%D1%83%D1%80%D0%B5%D1%82%D0%BA%D0%B0.jpg?raw=true' },
			4: { title: 'Старая скрипучая', text: 'Скрипит, но работает. Иногда.', img: 'https://github.com/Arsenic337492/New-year-gift/blob/main/images/%D0%A2%D0%B0%D0%B1%D1%83%D1%80%D0%B5%D1%82%D0%BA%D0%B8/%D0%A1%D1%82%D0%B0%D1%80%D0%B0%D1%8F%20%D1%82%D0%B0%D0%B1%D1%83%D1%80%D0%B5%D1%82%D0%BA%D0%B0.jpg?raw=true' },
			5: { title: 'Барная высокая', text: 'Смотрит на всех сверху. Иногда заслуженно.', img: 'https://github.com/Arsenic337492/New-year-gift/blob/main/images/%D0%A2%D0%B0%D0%B1%D1%83%D1%80%D0%B5%D1%82%D0%BA%D0%B8/%D0%91%D0%B0%D1%80%D0%BD%D0%B0%D1%8F%20%D1%82%D0%B0%D0%B1%D1%83%D1%80%D0%B5%D1%82%D0%BA%D0%B0.jpg?raw=true' },
			6: { title: 'Табуретка из ИКЕА', text: 'Простая, понятная, но собирать больно.', img: 'https://github.com/Arsenic337492/New-year-gift/blob/main/images/%D0%A2%D0%B0%D0%B1%D1%83%D1%80%D0%B5%D1%82%D0%BA%D0%B8/%D0%A2%D0%B0%D0%B1%D1%83%D1%80%D0%B5%D1%82%D0%BA%D0%B0%20%D0%B8%D0%B7%20%D0%98%D0%9A%D0%95%D0%98.jpg?raw=true' },
			7: { title: 'Самодельная из гаража', text: 'Выглядит опасно. Выдерживает всё.', img: 'https://github.com/Arsenic337492/New-year-gift/blob/main/images/%D0%A2%D0%B0%D0%B1%D1%83%D1%80%D0%B5%D1%82%D0%BA%D0%B8/%D0%A1%D0%B0%D0%BC%D0%BE%D0%B4%D0%B5%D0%BB%D1%8C%D0%BD%D0%B0%D1%8F%20%D1%82%D0%B0%D0%B1%D1%83%D1%80%D0%B5%D1%82%D0%BA%D0%B0.jpg?raw=true' },
			8: { title: 'Детская пластиковая', text: 'Яркая, лёгкая и вообще не для этого предназначена.', img: 'https://github.com/Arsenic337492/New-year-gift/blob/main/images/%D0%A2%D0%B0%D0%B1%D1%83%D1%80%D0%B5%D1%82%D0%BA%D0%B8/%D0%94%D0%B5%D1%82%D1%81%D0%BA%D0%B0%D1%8F%20%D1%82%D0%B0%D0%B1%D1%83%D1%80%D0%B5%D1%82%D0%BA%D0%B0.jpg?raw=true' },
			9: { title: 'Табуретка с мягким сиденьем', text: 'Комфорт превыше всего. Даже логики.', img: 'https://github.com/Arsenic337492/New-year-gift/blob/main/images/%D0%A2%D0%B0%D0%B1%D1%83%D1%80%D0%B5%D1%82%D0%BA%D0%B8/%D0%A2%D0%B0%D0%B1%D1%83%D1%80%D0%B5%D1%82%D0%BA%D0%B0%20%D1%81%20%D0%BC%D1%8F%D0%B3%D0%BA%D0%B8%D0%BC%20%D1%81%D0%B8%D0%B4%D0%B5%D0%BD%D1%8C%D0%B5%D0%BC.jpg?raw=true' }
		};

		let cur = 0;
		const answers = Array(questions.length).fill(null);
		const qCard = document.getElementById('q-card');
		const qCurrent = document.getElementById('q-current');
		const qTotal = document.getElementById('q-total');
		const btnPrev = document.getElementById('q-prev');
		const btnNext = document.getElementById('q-next');
		const qResult = document.getElementById('q-result');

		// cover / start
		const quizCover = document.getElementById('quiz-cover');
		const btnStart = document.getElementById('q-start');

		qTotal.textContent = questions.length;

		const render = () => {
			const q = questions[cur];
			qCurrent.textContent = (cur + 1);
			qCard.innerHTML = '';
			const h = document.createElement('h2'); h.textContent = q.text; h.className = 'q-question';
			qCard.appendChild(h);

			const opts = document.createElement('div'); opts.className = 'q-options';
			q.choices.forEach(ch => {
				const id = `q${cur}-${ch.v}`;
				const label = document.createElement('label');
				label.className = 'q-option';
				label.setAttribute('for', id);
				const input = document.createElement('input');
				input.type = 'radio';
				input.name = `q${cur}`;
				input.id = id;
				input.value = ch.v;
				if (answers[cur] === ch.v) input.checked = true;
				input.addEventListener('change', () => { answers[cur] = ch.v; });
				const span = document.createElement('span'); span.textContent = ch.t;
				label.appendChild(input); label.appendChild(span);
				opts.appendChild(label);
			});
			qCard.appendChild(opts);

			btnPrev.disabled = (cur === 0);
			btnNext.textContent = (cur === questions.length - 1) ? 'Завершить' : 'Далее';
			// скрыть результат при навигации
			qResult.hidden = true;
			document.getElementById('quiz').classList.remove('hidden');
		};

		// вынесенные обработчики, чтобы их можно было вызывать и из делегата
		const handlePrevClick = (e) => {
			if (e && e.preventDefault) e.preventDefault();
			if (cur > 0) {
				cur -= 1;
				render();
			}
		};

		const handleNextClick = (e) => {
			if (e && e.preventDefault) e.preventDefault();
			if (!answers[cur]) { alert('Выберите вариант, чтобы продолжить.'); return; }
			if (cur < questions.length - 1) {
				cur += 1;
				render();
				return;
			}

			// финал: подсчёт
			const tally = { A:0, B:0, C:0, G:0 };
			answers.forEach(a => { if (tally[a] !== undefined) tally[a]++; });

			const ordered = Object.keys(tally).sort((x,y) => tally[y]-tally[x]);
			const primary = ordered[0] || 'A';
			const secondary = ordered[1] || ordered[0] || 'A';

			const pairMap = {
				'A|A':1, 'B|B':2, 'C|C':3, 'G|G':4,
				'A|B':6, 'B|A':5, 'C|G':7, 'G|C':8
			};
			const key = `${primary}|${secondary}`;
			const resultId = pairMap[key] || 9;
			const res = results[resultId] || results[9];

			// показать результат
			// скрыть вопросы и показать результат
			document.getElementById('quiz').classList.add('hidden');
			qResult.hidden = false;
			qResult.innerHTML = `
				<img class="cover-img" src="${res.img}" alt="${res.title}" />
				<div class="cover-text">
					<h3>Ты — ${res.title}!</h3>
					<p>${res.text}</p>
				</div>
				<button id="q-done" class="quiz-btn">Вернуться к испытаниям</button>
			`;

			// пометить пазл как пройденный (для hub)
			localStorage.setItem(storageKey(1), '1');
			// обновить hub состояние (если пользователь вернётся)
			updateDoorState(puzzleButtons.filter(b => localStorage.getItem(storageKey(b.getAttribute('data-puzzle'))) === '1').length);

			document.getElementById('q-done').addEventListener('click', () => {
				location.href = 'hub.html';
			});
		};

		// привязываем обработчики, если кнопки найдены
		if (btnPrev) btnPrev.addEventListener('click', handlePrevClick);
		if (btnNext) btnNext.addEventListener('click', handleNextClick);

		// Start button: показать интерфейс и рендерить первый вопрос
		if (btnStart) {
			btnStart.addEventListener('click', () => {
				// скрыть титульник
				if (quizCover) quizCover.classList.add('hidden');
				// показать прогресс, карточку и контролы
				const progress = document.getElementById('q-progress');
				const controls = document.querySelector('.q-controls');
				if (progress) progress.classList.remove('hidden');
				if (qCard) qCard.classList.remove('hidden');
				if (controls) controls.classList.remove('hidden');
				// initial render first question
				render();
			});
		} else {
			// если кнопки нет — рендерим сразу (fallback)
			render();
		}

		// initial: do not render questions until start pressed
	}
	// --- Puzzle4 logic: задачи с переключением ---
	const puzzle4Content = document.getElementById('puzzle4-content');
	const nextBtn = document.getElementById('next-btn');
	if (puzzle4Content && nextBtn) {
		let currentTask = -1;
		let correctAnswers = 0;
		const tasks = [
			{
				title: 'Задача 1',
				text: 'У Хасана три ланчбокса: один он дал Джамалу, а второй Мухаммеду. Рассчитайте радиус поражения взрывной волны.',
				placeholder: 'Введите ответ',
				answer: '1'
			},
			{
				title: 'Задача 2',
				text: 'Летели 2 верблюда. Один зеленый, другой на север. Сколько будет стоить киллограм сушеных яблок, если ежу Геннадию 24 года.',
				placeholder: 'Введите ответ',
				answer: '42'
			},
			{
				title: 'Задача 3',
				text: 'Если утка умеет танцевать ламбаду, а холодильник ест только бананы, сколько раз Петрович должен хлопнуть в ладоши, чтобы дождь превратился в лимонад?',
				placeholder: 'Введите ответ',
				answer: '7'
			},
			{
				title: 'Задача 4',
				text: 'Сколько людей может поместиться в вагоне поезда, если объем тела человека 68 кубических дециметра, объем вагона 750.000 пластиковых стаканчиков (один - 200 мл), а при сильной давке стенки вагона могут изогнуться и объем вагона увеличится на 3% от изначального?',
				placeholder: 'Введите ответ',
				answer: '2279'
			},
			{
				title: 'Задача 5',
				text: 'В поезде 12 вагонов, каждый длиной 25 метров, шириной 3,2 метра и высотой 2,8 метра. В каждом вагоне одновременно едут пассажиры, масса которых распределена нормально со средним 70 кг и стандартным отклонением 12 кг, а плотность их расположения равна 0,45 человека на квадратный метр. Сколько энергии потребуется, чтобы поднять весь поезд массой 420 тонн на высоту 15 метров, если учесть сопротивление трения колёс по рельсам и изменение массы вагонов при движении (за счёт температуры и колебаний давления), а также отклонения массы пассажиров?',
				placeholder: 'Введите ответ',
				answer: '61740000'
			},
			{
				title: 'Задача 6',
				text: 'Решите тригонометрическое тождество: sin30°⋅cos60°+sin60°⋅cos30°',
				placeholder: 'Введите ответ',
				answer: '1'
			},
			{
				title: 'Задача 7',
				text: 'Сколько решений имеет это уравнение: sin2x=√2/2',
				placeholder: 'Введите ответ',
				answer: '4'
			},
			{
				title: 'Задача 8',
				text: 'Там есть города, но нет домов. Есть горы, но нет деревьев. Есть вода, но в ней нет рыбы. Что это?',
				placeholder: 'Введите ответ',
				answer: 'карта'
			},
			{
				title: 'Задача 9',
				text: 'Какое слово содержит всего три слога и целых 33 буквы?',
				placeholder: 'Введите ответ',
				answer: 'алфавит'
			},
			{
				title: 'Задача 10',
				text: 'Покупают, чтобы есть, но оно несъедобное.',
				placeholder: 'Введите ответ',
				answer: 'посуда'
			},
			{
				title: 'Задача 11',
				text: '2+3',
				placeholder: 'Введите ответ',
				answer: '5'
			},
			{
				title: 'Задача 12',
				text: '8/4',
				placeholder: 'Введите ответ',
				answer: '2'
			},
			{
				title: 'Задача 13',
				text: '7*2',
				placeholder: 'Введите ответ',
				answer: '14'
			},
			{
				title: 'Задача 14',
				text: '10-4',
				placeholder: 'Введите ответ',
				answer: '6'
			},
			{
				title: 'Задача 15',
				text: '11+1',
				placeholder: 'Введите ответ',
				answer: '12'
			}
		];

		nextBtn.addEventListener('click', () => {
			currentTask++;
			if (currentTask === 0) {
				nextBtn.textContent = 'Что блять...';
				// Добавляем элементы управления после первого клика
				const controlsDiv = nextBtn.parentElement;
				controlsDiv.innerHTML = `
					<span id="task-counter" style="color: white; font-weight: bold;">0/3</span>
					<input type="text" id="answer-input" placeholder="Введите ответ" style="padding: 0.5rem; border: 1px solid #ccc; border-radius: 0.5rem; font-size: 1rem;">
					<button id="answer-btn" class="quiz-btn" disabled>Ответ</button>
					<button id="next-btn" class="quiz-btn">Что блять...</button>
				`;
				// Переназначаем ссылки на новые элементы
				const newAnswerBtn = document.getElementById('answer-btn');
				const newAnswerInput = document.getElementById('answer-input');
				const newTaskCounter = document.getElementById('task-counter');
				const newNextBtn = document.getElementById('next-btn');
				
				// Добавляем обработчики для новых элементов
				newAnswerInput.addEventListener('input', () => {
					newAnswerBtn.disabled = newAnswerInput.value.trim() === '';
				});
				
				newAnswerBtn.addEventListener('click', () => {
					const userAnswer = newAnswerInput.value.trim().toLowerCase();
					const correctAnswer = tasks[currentTask].answer.toLowerCase();
					
					if (userAnswer === correctAnswer) {
						correctAnswers++;
						newTaskCounter.textContent = `${correctAnswers}/3`;
						
						if (correctAnswers >= 3) {
							// Пометить пазл как пройденный
							localStorage.setItem('puzzle-4', '1');
							puzzle4Content.innerHTML = '<h2>Поздравляем!</h2><p>Вы решили 3 задачи и прошли испытание!</p><button onclick="location.href=\'hub.html\'" class="quiz-btn">Вернуться к испытаниям</button>';
							newTaskCounter.parentElement.style.display = 'none';
						} else {
							// Перейти к следующей задаче
							currentTask++;
							if (currentTask < tasks.length) {
								const task = tasks[currentTask];
								puzzle4Content.innerHTML = `<h2>${task.title}</h2><p>${task.text}</p>`;
							}
							newAnswerInput.value = '';
							newAnswerBtn.disabled = true;
						}
					} else {
						// Анимация тряски поля ввода
						newAnswerInput.style.animation = 'shake 0.5s';
						setTimeout(() => {
							newAnswerInput.style.animation = '';
						}, 500);
						alert('Неправильный ответ. Попробуйте ещё раз.');
					}
				});
				
				newNextBtn.addEventListener('click', () => {
					currentTask++;
					if (currentTask < tasks.length) {
						const task = tasks[currentTask];
						let extraText = '';
						if (currentTask === 5) {
							extraText = '<p style="color: #666; font-style: italic;">Ладно, я все таки понижу сложность</p>';
						} else if (currentTask === 10) {
							extraText = '<p style="color: #666; font-style: italic;">Ладно, я все таки понижу сложность</p>';
						} else {
							const skipMessages = [
								'Не смог решить? Ладно, вот другая задача:',
								'Серьезно? Это же элементарно.',
								'Окей, попробуем что-то полегче...',
								'Ну что ж, вот следующая:',
								'Может, эта будет понятнее?',
								'Попробуй эту:'
							];
							extraText = `<p style="color: #666; font-style: italic;">${skipMessages[Math.floor(Math.random() * skipMessages.length)]}</p>`;
						}
						puzzle4Content.innerHTML = `<h2>${task.title}</h2>${extraText}<p>${task.text}</p>`;
					} else {
						// Пасхалка: дошел до конца, не решив ни одной задачи
						localStorage.setItem('puzzle-4', '1');
						puzzle4Content.innerHTML = '<h2>Ну ты капец!</h2><p>Это же были простейшие задачи, даже мой плюшевый кот их решить может! Иди отсюда!</p><button onclick="location.href=\'hub.html\'" class="quiz-btn">Вернуться к испытаниям</button>';
						newTaskCounter.parentElement.style.display = 'none';
					}
				});
			}
			if (currentTask < tasks.length) {
				const task = tasks[currentTask];
				puzzle4Content.innerHTML = `<h2>${task.title}</h2><p>${task.text}</p>`;
			} else {
				puzzle4Content.innerHTML = '<h2>Конец задач</h2>';
			}
		});
	}

	// ...existing code end...
});


