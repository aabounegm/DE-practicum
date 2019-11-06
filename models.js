/**
 * @file Defines the self-contained classes that mainly represent data and operations on them
 */

/**
 * Class representing a collection of a function (of one variable) 
 *   with its derivative (as an expression of both x and y)
 * The expression is in the form: $ y' = f(x, y) $, where f(x, y) is the function given here
 */
export class DifferentialFunction {
	/**
	 * @callback actualFunction The exact function solution
	 * @param {number} x independent variable
	 * @returns {number} value of the function at [x]
	 */
	/**
	 * @callback derivative
	 * @param {number} x x
	 * @param {number} y y
	 * @returns {number} y'(x,y)
	 */

	/**
	 * Constructor
	 * @param { actualFunction } exact The solution of the differential equation 
	 * @param { derivative } derivative The expression y'(x, y)
	 */
	constructor(exact, derivative) {
		/**
		 * @private
		 * @const
		 */
		this._actual = exact;

		/** 
		 * @private
		 *  @const
		 */
		this._df = derivative;
	}

	/**
	 * A method that gets the value of the actual solution at the input [x]
	 * @param {number} x x
	 * @returns {number} y
	 */
	exact(x) {
		if (arguments.length !== 1)
			throw 'f is a function of x only!';
		return this._actual(x);
	}

	/**
	 * A method that gets the value of y'(x, y)
	 * @param {number} x x
	 * @param {number} y y
	 * @returns {number} y'(x,y)
	 */
	derivative(x, y) {
		if (arguments.length !== 2)
			throw 'f\' is in terms of x and y';
		return this._df(x, y);
	}
}


/**
 * Object containing configuration of numerical methods
 * @typedef {Object} Config
 * @property {number} config.x0 The start of the domain of the function
 * @property {number} config.y0 The value of the solution of the function at [x0]
 * @property {number} config.X The end of the domain of the function
 * @property {number} config.h The step to use for the methods
 */
/**
 * Wrapper for a point with x-y coordinates
 * @typedef {Object} point
 * @property {number} x The value of the x-coordinate
 * @property {number} y The value of the y-coordinate
 */

/**
 * A numerical method is used to approximate a solution to a differential equation y' = f(x, y).
 * This class is a base with common properties/implementation that all numerical methods implement.
 * It is callable, meaning that an instance of it is a function that can be directly called.
 * Classes implementing a numerical method should extend this one, overridding only the `step` method
 * @abstract
 * @extends Function To make it callable
 */
export class NumericalMethod extends Function {
	x0; y0; X; h; df; // To silence some errors due to using self
	/**
	 * Initializes the function with the given values
	 * @param {derivative} df The expression in terms of both x and y
	 * @param {Config} [config] The default config to apply if not provided otherwise
	 */
	constructor(df, config) {
		if (new.target === NumericalMethod) throw new TypeError('Cannot instantiate abstract class!');
		if (typeof df !== 'function')
			throw new TypeError('Please pass a function to the constructor');
		super('...args', 'return this.__self__.__call__(...args)');
		/** @alias NumericalMethod# */
		let self = this.bind(this);
		self.df = df;
		if (config) {
			self.x0 = config.x0;
			self.y0 = config.y0;
			self.X = config.X;
			self.h = config.h;
		}
		this.__self__ = self;
		return self;
	}

	/**
	 * Makes the object callable. Should perform the calculation according to config object.
	 * @param {Config} [config] Override configuration passed in constructor
	 * @returns {point[]}
	 */
	__call__(config) {
		let { x0, y0, X, h } = {
			x0: this.x0,
			y0: this.y0,
			X: this.X,
			h: this.h,
			...config,
		};

		if (h == 0)
			return [];

		/** @type {point[]} */
		let data = [];
		while (x0 <= X) {
			data.push({ x: x0, y: y0 });
			({ x: x0, y: y0 } = this.step(x0, y0, h));
		}
		return data;
	}

	/**
	 * Represents taking one step of the approximation method
	 * @param {number} x x-coordinate of the given point
	 * @param {number} y y-coordinate of the given point
	 * @param {number} h step to move [x] by
	 * @returns {point} An object containing the next values of x and y
	 */
	step(x, y, h) { throw new TypeError('Step function not implemented!'); }
}

/**
 * Implementation of Euler method
 */
export class Euler extends NumericalMethod {
	step(x, y, h) {
		return {
			y: y + h * this.df(x, y),
			x: x + h,
		};
	}
}

/**
 * Implementation of Improved-Euler method
 */
export class ImprovedEuler extends NumericalMethod {
	step(x, y, h) {
		const k1 = this.df(x, y);
		const k2 = this.df(x + h, y + h * k1);
		return {
			y: y + (h / 2) * (k1 + k2),
			x: x + h,
		};
	}
}

/**
 * Implementation of Runge-Kutta method
 */
export class RungeKutta extends NumericalMethod {
	step(x, y, h) {
		const k1 = h * this.df(x, y);
		const k2 = h * this.df(x + h / 2, y + k1 / 2);
		const k3 = h * this.df(x + h / 2, y + k2 / 2);
		const k4 = h * this.df(x + h, y + k3);
		return {
			y: y + (1 / 6) * (k1 + 2 * k2 + 2 * k3 + k4),
			x: x + h,
		};
	}
}
