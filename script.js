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
				completed += 1;
			}
		});
		updateDoorState(completed);
	};

	// обновить дверь: если все пройдены — разблокировать
	const updateDoorState = (completedCount) => {
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

	// клик по puzzle — помечаем как пройденный (заглушка поведения)
	puzzleButtons.forEach(btn => {
		btn.addEventListener('click', (e) => {
			// по умолчанию разрешаем переход на страницу пазла; 
			// для теста также помечаем как пройденный здесь
			const id = btn.getAttribute('data-puzzle');
			localStorage.setItem(storageKey(id), '1');
			btn.classList.add('visited');

			// пересчитать и обновить дверь
			const completed = puzzleButtons.filter(b => localStorage.getItem(storageKey(b.getAttribute('data-puzzle'))) === '1').length;
			updateDoorState(completed);

			// если хотите, можно перейти на страницу пазла; поведение оставлено (ссылка)
			// если нужно предотвратить навигацию — раскомментируйте e.preventDefault();
			// e.preventDefault();
		});
	});

	// сброс прогресса (для разработки) — удержать Ctrl+Shift и клик по двери
	if (finalDoor) {
		finalDoor.addEventListener('click', (e) => {
			// dev-сброс
			if (e.ctrlKey && e.shiftKey) {
				for (let i=1;i<=TOTAL;i++) localStorage.removeItem(storageKey(i));
				puzzleButtons.forEach(b=>b.classList.remove('visited'));
				updateDoorState(0);
				alert('Прогресс сброшен (dev).');
				return;
			}

			// если дверь разблокирована — анимируем "вход"
			if (finalDoor.classList.contains('unlocked') && !finalDoor.classList.contains('entered')) {
				e.preventDefault();
				// пометить как entered — сменит фон и масштабирует (см. CSS)
				finalDoor.classList.add('entered');
				// через время анимации перенаправляем на финальную страницу
				setTimeout(() => {
					window.location.href = finalDoor.getAttribute('href') || 'final.html';
				}, 700); // совпадает с transition для smooth
			}
		});
	}

	// инициализация при загрузке
	initHubState();
});
