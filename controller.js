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

// TODO: convert the classes into singletons

/**
 * Manages the interface of the main chart
 */
export class ChartController {
	/**
	 * 
	 * @param {DifferentialFunction} funcs The function pair (exact and derivative) to compute )
	 * @param {Object<string, number>} values The parameters based on which to calculate the approximations
	 * @param {Object<string, HTMLInputElement>} elements The input elements to listen for changes on
	 */
	constructor(funcs, { x0 = 0, y0 = 0, X = 1, h = 0.1 } = {}, { x0El, y0El, XEl, hEl } = {}) {
		this.funcs = funcs;

		// @ts-ignore
		this.ctx = document.getElementById('graph').getContext('2d');
		this.chart = null;

		/** @type {Object<String, {el: HTMLInputElement, val: number}>} */
		this.vars = {
			x0: { el: x0El || document.getElementById('x0'), val: x0 },
			y0: { el: y0El || document.getElementById('y0'), val: y0 },
			X: { el: XEl || document.getElementById('X'), val: X },
			h: { el: hEl || document.getElementById('h'), val: h },
		};

		/** @type {point[]} */  this.eulerData = [];
		/** @type {point[]} */  this.improvedEulerData = [];
		/** @type {point[]} */  this.rungeKuttaData = [];
		/** @type {point[]} */  this.exactData = [];
		/** @type {number[]} */ this.domain = [];

		this._registerListeners();
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
			h: this.vars.h.val,
		};

		const euler = new Euler(this.funcs.derivative.bind(this.funcs), config);
		const improvedEuler = new ImprovedEuler(this.funcs.derivative.bind(this.funcs), config);
		const rungeKutta = new RungeKutta(this.funcs.derivative.bind(this.funcs), config);

		this.domain = Array.from({ length: 1 + (config.X - config.x0) / config.h },
			(_, i) => (i * config.h + config.x0));
		const xLabels = this.domain.map(x => x.toFixed(5));

		this.eulerData = euler();
		this.improvedEulerData = improvedEuler();
		this.rungeKuttaData = rungeKutta();
		this.exactData = this.domain.map(x => ({ x, y: this.funcs.exact(x) }));

		eventManager.dispatchEvent(new Event('chartDataUpdated'));

		this.chart = new Chart(this.ctx, {
			type: 'line',
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

	_registerListeners() {
		for (let obj of Object.values(this.vars)) {
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
 * Manages the chart for showing the local error
 */
export class TruncationError {
	/**
	 * Initializes connection to 
	 * @param {ChartController} controller Required to easily access the latest data
	 */
	constructor(controller) {
		// @ts-ignore
		this.ctx = document.getElementById('local-error').getContext('2d');
		this.values = controller;
		this.chart = null;

		this._registerListeners();
	}

	buildChart() {
		if (this.chart)
			this.chart.destroy();

		const { domain, exactData, eulerData, improvedEulerData, rungeKuttaData } = this.values;
		const xLabels = domain.map(x => x.toFixed(5));

		/**
		 * Calculates the difference between the given point and the exact solution
		 * @param {point} param0 
		 * @param {number} index
		 */
		const diff = ({ x, y }, index) => ({ x, y: exactData[index].y - y });

		const eulerDiff = eulerData.map(diff);
		const improvedEulerDiff = improvedEulerData.map(diff);
		const rungeKuttaDiff = rungeKuttaData.map(diff);

		this.chart = new Chart(this.ctx, {
			type: 'line',
			data: {
				labels: xLabels,
				datasets: [
					{ data: eulerDiff, label: 'Euler', borderColor: 'aqua', },
					{ data: improvedEulerDiff, label: 'Improved-Euler', borderColor: 'lime' },
					{ data: rungeKuttaDiff, label: 'Runge-Kutta', borderColor: 'brown' },
				],
			},
		});
	}

	_registerListeners() {
		eventManager.addEventListener('chartDataUpdated', this.buildChart.bind(this));
	}
}