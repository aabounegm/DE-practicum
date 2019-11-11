/**
 * @file Controller that uses the models in [models.js](./models.js) and connects to the View (HTML)
 * @typedef { import('./models').point } point
 */

import { Euler, ImprovedEuler, RungeKutta, DifferentialFunction } from './models.js';

// @ts-ignore
var Chart = window.Chart;
Chart.defaults.global.elements.line.fill = false;

/** Used to handle communication between the main graph and the error graph */
const eventManager = new EventTarget();

/**
 * Generalization of a controller that accepts an HTML element to draw a graph on
 * @abstract
 */
class ChartController {
	/**
	 * Initializes common actions for all charts
	 * @param {HTMLCanvasElement} canvas The Canvas element to draw the chart in
	 * @param {...any} args Included to allow subclasses to add any parameters needed
	 */
	constructor(canvas, ...args) {
		if (new.target === ChartController) throw new TypeError('Cannot instantiate abstract class');
		this.ctx = canvas.getContext('2d');
		this.chart = null;
		this._registerListeners(...args);
	}
	/** @param {...any} args Included to allow subclasses to add any parameters needed */
	getData(...args) { }

	/** @param {...any} args Included to allow subclasses to add any parameters needed */
	buildChart(...args) { throw new TypeError('Not implemented'); }

	/** @param {...any} args Included to allow subclasses to add any parameters needed */
	_registerListeners(...args) { }
}

/**
 * Manages the interface of the main chart
 */
export class SolutionGraph extends ChartController {
	/**
	 * @param {HTMLCanvasElement} canvas
	 * @param {DifferentialFunction} funcs The function pair (exact and derivative) to compute
	 * @param {Object<string, number>} [values] The parameters based on which to calculate the approximations
	 * @param {Object<string, HTMLInputElement>} [elements] The input elements to listen for changes on
	 */
	constructor(canvas, funcs, { x0 = 0, y0 = 0, X = 1, N = 20 } = {}, { x0El, y0El, XEl, hEl } = {}) {
		/** @type {Object<String, {el: HTMLInputElement, val: number}>} */
		const vars = {
			x0: { el: x0El || document.getElementById('x0'), val: x0 },
			y0: { el: y0El || document.getElementById('y0'), val: y0 },
			X: { el: XEl || document.getElementById('X'), val: X },
			N: { el: hEl || document.getElementById('N'), val: N },
		};
		super(canvas, vars);

		this.vars = vars;
		this.funcs = funcs;

		/** @type {point[]} */  this.eulerData = [];
		/** @type {point[]} */  this.improvedEulerData = [];
		/** @type {point[]} */  this.rungeKuttaData = [];
		/** @type {point[]} */  this.exactData = [];
		/** @type {number[]} */ this.domain = [];
	}

	getData() {
		return {
			euler: this.eulerData,
			improvedEuler: this.improvedEulerData,
			rungeKutta: this.rungeKuttaData,
			exact: this.exactData,
			domain: this.domain,
		};
	}

	/**
	 * Refreshes the chart using the latest input parameters
	 */
	buildChart() {
		if (this.chart)
			this.chart.destroy();

		const config = {
			x0: this.vars.x0.val,
			y0: this.vars.y0.val,
			X: this.vars.X.val,
			N: this.vars.N.val,
			h: (this.vars.X.val - this.vars.x0.val) / this.vars.N.val,
		};

		const euler = new Euler(this.funcs.derivative.bind(this.funcs), config);
		const improvedEuler = new ImprovedEuler(this.funcs.derivative.bind(this.funcs), config);
		const rungeKutta = new RungeKutta(this.funcs.derivative.bind(this.funcs), config);

		this.domain = Array.from({ length: config.N },
			(_, i) => (i * config.h + config.x0));
		const xLabels = this.domain.map(x => x.toFixed(5));

		this.eulerData = euler();
		this.improvedEulerData = improvedEuler();
		this.rungeKuttaData = rungeKutta();
		this.exactData = this.domain.map(x => ({ x, y: this.funcs.exact(x) }));

		eventManager.dispatchEvent(new CustomEvent('approximationsUpdated', {
			detail: { ...this.getData(), config, },
		}));

		this.chart = new Chart(this.ctx, {
			type: 'line',
			options: {
				title: {
					text: 'Solution vs approximations',
					display: true,
				},
				scales: {
					xAxes: [{
						scaleLabel: {
							display: true,
							labelString: 'x',
						},
					}],
					yAxes: [{
						scaleLabel: {
							display: true,
							labelString: 'f(x)',
						},
					}],
				},
			},
			data: {
				labels: xLabels,
				datasets: [
					{ data: this.eulerData, label: 'Euler', borderColor: 'aqua', },
					{ data: this.improvedEulerData, label: 'Improved-Euler', borderColor: 'lime' },
					{ data: this.rungeKuttaData, label: 'Runge-Kutta', borderColor: 'brown' },
					{ data: this.exactData, label: 'Exact', borderColor: 'black' },
				],
			},
		});
	}

	/**
	 * Registers listeners to changes on input to update the respective variables and the chart
	 * @param {Object<String, {el: HTMLInputElement, val: number}>} vars Object containing HTML input elements and their respective initial values 
	 */
	_registerListeners(vars) {
		for (let obj of Object.values(vars)) {
			obj.el.value = obj.val;
			obj.el.addEventListener('input', (event) => {
				let input = parseFloat(event.target.value);
				if (!Number.isFinite(input) || input === obj.val)
					return;
				obj.val = input;
				this.buildChart();
			});
		}
	}
}

/**
 * Specific functionality common to Error graphs
 * @abstract
 */
class ErrorChartController extends ChartController {
	/**
	 * Initializes local data
	 * @param {HTMLCanvasElement} canvas Element to draw the chart on
	 */
	constructor(canvas) {
		super(canvas);

		/** @type {point[]} */ this.eulerData = [];
		/** @type {point[]} */ this.improvedEulerData = [];
		/** @type {point[]} */ this.rungeKuttaData = [];
	}

	/**
	 * Returns the data currently held in the object
	 * @returns {Object<string, point[]>}
	 */
	getData() {
		return {
			euler: this.eulerData,
			improvedEuler: this.improvedEulerData,
			rungeKutta: this.rungeKuttaData
		};
	}

	/**
	 * Registers listener to changes in approximation chart updates to update error
	 */
	_registerListeners() {
		eventManager.addEventListener('approximationsUpdated', this.buildChart.bind(this));
	}
}

/**
 * Manages the chart for showing the global error
 */
export class GlobalError extends ErrorChartController {
	/**
	 * @param {HTMLCanvasElement} canvas
	 * @param {DifferentialFunction} funcs The function pair (exact and derivative) to compute
	 */
	constructor(canvas, funcs) {
		super(canvas);
		this.funcs = funcs;
	}

	/**
	 * Updates the chart whenever the steps count gets updated
	 * @param {Object} eventData Contains the updated configuration, along with the new function data
	 */
	buildChart(eventData) {
		const data = eventData.detail;
		const { exact, config } = data;
		if (this.chart)
			this.chart.destroy();

		const euler = new Euler(this.funcs.derivative.bind(this.funcs), config);
		const improvedEuler = new ImprovedEuler(this.funcs.derivative.bind(this.funcs), config);
		const rungeKutta = new RungeKutta(this.funcs.derivative.bind(this.funcs), config);

		const domain = Array.from({ length: config.N }, (_, i) => i + 1);

		/** @type {point[]} */ this.eulerData = [];
		/** @type {point[]} */ this.improvedEulerData = [];
		/** @type {point[]} */ this.rungeKuttaData = [];

		domain.forEach(N => {
			/**
			 * For the N in the closure, returns the difference between the solution and given approximation
			 * @param {point[]} dataset 
			 */
			const diff = (dataset) => ({
				x: N,
				y: this.funcs.exact(config.X) - dataset[N - 1].y
			});

			const h = (config.X - config.x0) / N;

			this.eulerData.push(diff(euler({ h })));
			this.improvedEulerData.push(diff(improvedEuler({ h })));
			this.rungeKuttaData.push(diff(rungeKutta({ h })));
		});

		eventManager.dispatchEvent(new CustomEvent('globalErrorUpdated', {
			detail: this.getData(),
		}));

		this.chart = new Chart(this.ctx, {
			type: 'line',
			data: {
				labels: domain,
				datasets: [
					{ data: this.eulerData, label: 'Euler', borderColor: 'aqua', },
					{ data: this.improvedEulerData, label: 'Improved-Euler', borderColor: 'lime' },
					{ data: this.rungeKuttaData, label: 'Runge-Kutta', borderColor: 'brown' },
				],
			},
			options: {
				title: {
					text: 'Global error',
					display: true,
				},
				scales: {
					xAxes: [{
						scaleLabel: {
							display: true,
							labelString: 'N',
						},
					}],
					yAxes: [{
						scaleLabel: {
							display: true,
							labelString: 'Last global error',
						},
					}],
				},
			},
		});
	}
}

/**
 * Manages the chart for showing the local error
 */
export class LocalError extends ErrorChartController {
	/**
	 * Updates the chart whenever the control variables get updated
	 * @param {Object} eventData Contains the updated configuration, along with the new function data
	 */
	buildChart(eventData) {
		const data = eventData.detail;
		if (this.chart)
			this.chart.destroy();

		const { domain, euler, improvedEuler, rungeKutta, exact } = data;
		const xLabels = domain.map(x => x.toFixed(5));

		/**
		 * Calculates the difference between the global error at the current and previous points to get the local error
		 * @param {point} item
		 * @param {number} index
		 * @param {point[]} arr
		 */
		const diff = (item, index, arr) => {
			if (index === 0)
				return { x: 0, y: 0 };
			if (index >= exact.length)
				return {};
			const curGlobal = exact[index].y - item.y;
			const prevGlobal = exact[index - 1].y - arr[index - 1].y;
			return { x: item.x, y: curGlobal - prevGlobal };
		};

		this.eulerData = euler.map(diff);
		this.improvedEulerData = improvedEuler.map(diff);
		this.rungeKuttaData = rungeKutta.map(diff);

		eventManager.dispatchEvent(new CustomEvent('localErrorUpdated', {
			detail: this.getData(),
		}));

		this.chart = new Chart(this.ctx, {
			type: 'line',
			data: {
				labels: xLabels,
				datasets: [
					{ data: this.eulerData, label: 'Euler', borderColor: 'aqua', },
					{ data: this.improvedEulerData, label: 'Improved-Euler', borderColor: 'lime' },
					{ data: this.rungeKuttaData, label: 'Runge-Kutta', borderColor: 'brown' },
				],
			},
			options: {
				title: {
					text: 'Local error',
					display: true,
				},
				scales: {
					xAxes: [{
						scaleLabel: {
							display: true,
							labelString: 'x',
						},
					}],
					yAxes: [{
						scaleLabel: {
							display: true,
							labelString: 'Local error',
						},
					}],
				},
			},
		});
	}
}
