export class DifferentialFunction {
	constructor(actual, derivative) {
		this._actual = actual;
		this._df = derivative;
	}
	exact(x) {
		if (arguments.length !== 1)
			throw 'f is a function of x only!';
		return this._actual(x);
	}
	derivative(x, y) {
		if (arguments.length !== 2)
			throw 'f\' is in terms of x and y';
		return this._df(x, y);
	}
}

export class NumericalMethods {
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

	eulerStep(x, y, h) {
		return {
			y: y + h * this.f(x, y),
			x: x + h,
		};
	}
	euler(config) {
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
			y: y + (1 / 6) * (k1 + 2 * k2 + 2 * k3 + k4),
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
			const { x, y } = f(x0, y0, h);
			x0 = x;
			y0 = y;
		}
		return data;
	}
}
