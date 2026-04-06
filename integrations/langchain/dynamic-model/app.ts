import { createApp } from '@agentuity/runtime';
import agents from './src/agent';
import router from './src/api';

export default await createApp({
	agents,
	router,
	workbench: true,
});
