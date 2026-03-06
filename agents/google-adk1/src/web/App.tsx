import { useAnalytics, useAPI } from '@agentuity/react';
import { type ChangeEvent, useCallback, useState } from 'react';
import './App.css';

const WORKBENCH_PATH = process.env.AGENTUITY_PUBLIC_WORKBENCH_PATH;

export function App() {
        const [adkCity, setAdkCity] = useState('London');

        const {
                data: adkResult,
                invoke: runAdkTime,
                isLoading: isAdkLoading,
                error: adkError,
        } = useAPI('POST /api/adk-time');

	const { track } = useAnalytics();

        const handleAdkTime = useCallback(async () => {
                track('adk_time_lookup', {
                        city: adkCity,
                });

                await runAdkTime({ city: adkCity });
        }, [adkCity, runAdkTime, track]);

	return (
		<div className="text-white flex font-sans justify-center min-h-screen">
			<div className="flex flex-col gap-4 max-w-3xl p-16 w-full">
				{/* Header */}
				<div className="items-center flex flex-col gap-2 justify-center mb-8 relative text-center">
					<svg
						aria-hidden="true"
						className="h-auto mb-4 w-12"
						fill="none"
						height="191"
						viewBox="0 0 220 191"
						width="220"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							clipRule="evenodd"
							d="M220 191H0L31.427 136.5H0L8 122.5H180.5L220 191ZM47.5879 136.5L24.2339 177H195.766L172.412 136.5H47.5879Z"
							fill="var(--color-cyan-500)"
							fillRule="evenodd"
						/>
						<path
							clipRule="evenodd"
							d="M110 0L157.448 82.5H189L197 96.5H54.5L110 0ZM78.7021 82.5L110 28.0811L141.298 82.5H78.7021Z"
							fill="var(--color-cyan-500)"
							fillRule="evenodd"
						/>
					</svg>

					<h1 className="text-5xl font-thin">Welcome to Agentuity</h1>

					<p className="text-gray-400 text-lg">
						The <span className="italic font-serif">Full-Stack</span> Platform for AI Agents
					</p>
				</div>

				{/* ADK Time Form */}
				<div className="bg-black border border-gray-900 text-gray-400 rounded-lg p-8 shadow-2xl flex flex-col gap-6">
                                        <div className="items-center flex flex-wrap gap-3">
                                                <h3 className="text-white text-xl font-normal">Google ADK Inside Agentuity</h3>

                                                <div className="text-xs text-gray-500 ml-auto">
                                                        Route: <code className="text-gray-300">POST /api/adk-time</code>
                                                </div>
                                        </div>

                                        <p className="text-sm text-gray-500">
                                                This app is now focused on a single ADK bridge flow: the request goes through
                                                Agentuity API/runtime and executes the Google ADK `rootAgent` under the hood.
                                        </p>

                                        <div className="items-center flex flex-wrap gap-2">
                                                <span>Get current time for</span>

                                                <input
                                                        className="bg-gray-950 border border-gray-800 rounded text-white py-1.5 px-3 min-w-44 focus:outline-cyan-500 focus:outline-2 focus:outline-offset-2"
                                                        disabled={isAdkLoading}
                                                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                                                setAdkCity(e.currentTarget.value)
                                                        }
                                                        placeholder="City"
                                                        value={adkCity}
                                                />

                                                <button
                                                        className="bg-cyan-900 border border-cyan-700 rounded text-white cursor-pointer text-sm transition-colors py-1.5 px-3 hover:bg-cyan-800 disabled:opacity-50 disabled:cursor-not-allowed"
                                                        disabled={isAdkLoading || adkCity.trim().length === 0}
                                                        onClick={handleAdkTime}
                                                        type="button"
                                                >
                                                        {isAdkLoading ? 'Running ADK...' : 'Run ADK'}
                                                </button>
                                        </div>

                                        {adkError ? (
                                                <div className="text-sm bg-gray-950 border border-red-900 rounded-md text-red-400 py-3 px-4">
                                                        {adkError.message}
                                                </div>
                                        ) : adkResult ? (
                                                <div className="flex flex-col gap-2">
                                                        <div className="text-sm bg-gray-950 border border-gray-800 rounded-md text-cyan-400 py-3 px-4">
                                                                {adkResult.response}
                                                        </div>

                                                        <div className="text-xs text-gray-500">
                                                                Events: <strong className="text-gray-300">{adkResult.eventCount}</strong>
                                                        </div>
                                                </div>
                                        ) : (
                                                <div className="text-sm bg-gray-950 border border-gray-800 rounded-md text-gray-600 py-3 px-4">
                                                        ADK response will appear here
                                                </div>
                                        )}
                                </div>

                                <div className="bg-black border border-gray-900 rounded-lg p-8">
                                        <h3 className="text-white text-xl font-normal leading-none m-0 mb-6">Next Steps</h3>

					<div className="flex flex-col gap-6">
						{[
							{
								key: 'customize-agent',
								title: 'Customize ADK behavior',
								text: (
									<>
										Edit <code className="text-white">src/adk/agent.ts</code> to change
										tools, instructions, and model behavior.
									</>
								),
							},
							{
								key: 'bridge-agent',
								title: 'Adjust Agentuity bridge',
								text: (
									<>
										Update{' '}
										<code className="text-white">src/agent/adk-time/agent.ts</code>{' '}
                                                                                to control prompt shaping and output mapping.
                                                                        </>
                                                                ),
							},
                                                        {
								key: 'api-route',
								title: 'Expose more ADK endpoints',
                                                                text: (
                                                                        <>
										Add more routes in{' '}
                                                                                <code className="text-white">src/api/index.ts</code> for additional
                                                                                ADK-backed capabilities.
                                                                        </>
                                                                ),
                                                        },
							WORKBENCH_PATH
								? {
										key: 'workbench',
										title: (
											<>
												Try{' '}
												<a href={WORKBENCH_PATH} className="underline relative">
													Workbench
												</a>
											</>
										),
										text: <>Test ADK bridge and agent traces directly in the dev UI.</>,
									}
								: null,
						]
							.filter((step): step is NonNullable<typeof step> => Boolean(step))
							.map((step) => (
								<div key={step.key} className="items-start flex gap-3">
									<div className="items-center bg-green-950 border border-green-500 rounded flex size-4 shrink-0 justify-center">
										<svg
											aria-hidden="true"
											className="size-2.5"
											fill="none"
											height="24"
											stroke="var(--color-green-500)"
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth="2"
											viewBox="0 0 24 24"
											width="24"
											xmlns="http://www.w3.org/2000/svg"
										>
											<path d="M20 6 9 17l-5-5"></path>
										</svg>
									</div>

									<div>
										<h4 className="text-white text-sm font-normal -mt-0.5 mb-0.5">
											{step.title}
										</h4>

										<p className="text-gray-400 text-xs">{step.text}</p>
									</div>
								</div>
							))}
					</div>
				</div>
			</div>
		</div>
	);
}
