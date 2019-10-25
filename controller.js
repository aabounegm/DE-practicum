import { NumericalMethods, DifferentialFunction } from './models.js';

export default class ChartController {
	constructor(funcs, { x0, y0, X, h } = {}) {
		this.funcs = funcs;

		Chart.defaults.global.elements.line.fill = false;
		this.ctx = document.getElementById('graph').getContext('2d');
		this.chart = null;

		this.vars = {
			x0: { el: document.getElementById('x0'), val: x0 },
			y0: { el: document.getElementById('y0'), val: y0 },
			X: { el: document.getElementById('X'), val: X },
			h: { el: document.getElementById('h'), val: h },
		};

		this._registerListeners();
	}

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

		const euler = methods.euler();
		// const improvedEuler = methods.improvedEuler();
		const runge = methods.rungeKutta();

		this.chart = new Chart(this.ctx, {
			type: 'line',
			data: {
				labels: domain,
				datasets: [
					{ data: euler, label: 'Euler', },
					// { data: improvedEuler, label: 'Improved-Euler', },
					{ data: runge, label: 'Runge' },
					{ data: domain.map(x => this.funcs.exact(x)), label: 'Exact' },
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
