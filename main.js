/**
 * @author Abdelrahman Abounegm (Group 4) <a.abounegm@innopolis.university>
 * @file The main entry of the entire program that uses classes and methods from other files
 */

import { SolutionGraph, GlobalError } from './controller.js';
import { DifferentialFunction } from './models.js';

const initialValues = {
	x0: 1,
	y0: 2,
	X: 10,
	h: 0.1,
};

const f = (x) => 3 * (x ** 2) - x;
const df = (x, y) => 1 + 2 * y / x;

const functions = new DifferentialFunction(f, df);

/** @type {HTMLCanvasElement} */
// @ts-ignore
const mainGraph = document.getElementById('graph')

/** @type {HTMLCanvasElement} */
// @ts-ignore
const globalErrorGraph = document.getElementById('global-error')


const controller = new SolutionGraph(mainGraph, functions, initialValues);
const errorController = new GlobalError(globalErrorGraph);

controller.buildChart();
