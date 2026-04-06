import { createApp } from '@agentuity/runtime';
import router from './src/api';

export default await createApp({
	agents: [],
	router,
	workbench: true,
});
