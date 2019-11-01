import { NumericalMethods, DifferentialFunction } from './models.js';

// @ts-ignore
var Chart = window.Chart;

const eventManager = new EventTarget();

export default class ChartController {
	/**
	 * 
	 * @param {DifferentialFunction} funcs The function pair (exact and derivative) to compute )
	 * @param {Object<string, number>} values The parameters based on which to calculate the approximations
	 * @param {Object<string, HTMLInputElement>} elements The input elements to listen for changes on
	 */
	constructor(funcs, { x0 = 0, y0 = 0, X = 1, h = 0.1 } = {}, { x0El, y0El, XEl, hEl } = {}) {
		this.funcs = funcs;

		Chart.defaults.global.elements.line.fill = false;

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

		/**
		 * @typedef {import('./models').point} point
		 */

		/** @type {point[]} */  this.eulerData = [];
		/** @type {point[]} */  this.improvedEulerData = [];
		/** @type {point[]} */  this.rungeData = [];

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

		const methods = new NumericalMethods(this.funcs.derivative.bind(this.funcs), config);

		const domain = Array.from({ length: 1 + (config.X - config.x0) / config.h },
			(_, i) => (i * config.h + config.x0).toFixed(5));

		this.eulerData = methods.euler();
		this.improvedEulerData = methods.improvedEuler();
		this.rungeData = methods.rungeKutta();
		eventManager.dispatchEvent(new Event('chartDataUpdated'));

		this.chart = new Chart(this.ctx, {
			type: 'line',
			data: {
				labels: domain,
				datasets: [
					{ data: this.eulerData, label: 'Euler', },
					{ data: this.improvedEulerData, label: 'Improved-Euler', },
					{ data: this.rungeData, label: 'Runge' },
					{ data: domain.map(x => this.funcs.exact(parseFloat(x))), label: 'Exact' },
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
