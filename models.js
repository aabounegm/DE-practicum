export default class NumericalMethods {
	constructor(f, config) {
		if (typeof f !== 'function')
			throw 'Please pass a function to the constructor';
		this.f = f;
		if (config) {
			this.x0 = config.x0;
			this.y0 = config.y0;
			this.X = config.X;
			this.h = config.h;
		}
	}

	euler({ x0, y0, X, h }) {
		if (h == 0)
			return;
		let data = [];
		while (x0 <= X) {
			data.push({ x: x0, y: y0 });
			y0 += h * this.f(x0, y0);
			x0 += h;
		}
		data.push({ x: x0, y: y0 });
		return data;
	}

	eulerStep(x, y, h) {
		return {
			y: y + h * this.f(x, y),
			x: x + h,
		};
	}

	eulerWrapped(config) {
		return this._wrap(this.eulerStep.bind(this), { ...config });
	}


	improvedEuler({ }) {

	}

	rungeKuttaStep(x, y, h) {
		const k1 = h * this.f(x, y);
		const k2 = h * this.f(x + h / 2, y + k1 / 2);
		const k3 = h * this.f(x + h / 2, y + k2 / 2);
		const k4 = h * this.f(x + h, y + k3);
		return {
			y: (1 / 6) * (k1 + 2 * k2 + 2 * k3 + k4),
			x: x + h,
		};
	}
	rungeKutta(config) {
		return this._wrap(this.rungeKuttaStep.bind(this), { ...config })
	}

	_wrap(f, { x0, y0, X, h }) {
		x0 = x0 || this.x0;
		y0 = y0 || this.y0;
		X = X || this.X;
		h = h || this.h;

		if (h == 0)
			return [];

		let data = [];
		while (x0 <= X) {
			data.push({ x: x0, y: y0 });
			let val = f(x0, y0, h);
			x0 = val.x;
			y0 = val.y;
		}
		return data;
	}
}
