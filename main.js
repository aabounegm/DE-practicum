function f(x, y) {
	return 1 + 2 * y / x;
}

const initialValues = {
	x0: 1,
	y0: 2,
	X: 10,
	h: 0.1,
};

let controller = new ChartController(f, initialValues);

controller.buildChart();
