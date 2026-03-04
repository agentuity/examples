// Pre-defined coding challenges shown as selectable options in the UI.
// Each prompt is sent to the agent, which generates and executes solutions.
export const PROMPTS = [
	{
		label: 'Fibonacci Sequence',
		prompt:
			'Write a function that returns the first N numbers in the Fibonacci sequence, then call it with N=10 and print the result.',
	},
	{
		label: 'FizzBuzz',
		prompt:
			'Write a FizzBuzz implementation that prints numbers 1-30, replacing multiples of 3 with "Fizz", multiples of 5 with "Buzz", and multiples of both with "FizzBuzz".',
	},
	{
		label: 'Merge Sort',
		prompt:
			'Implement a merge sort algorithm. Sort [38, 27, 43, 3, 9, 82, 10] and print the sorted result.',
	},
] as const;
