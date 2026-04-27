import 'react-native-gesture-handler';
import { registerRootComponent } from 'expo';
import { enableScreens } from 'react-native-screens';

import App from './App';

// En web, `screensEnabled()` viene false por defecto: las pestañas inactivas no se ocultan
// y con fondos transparentes se ven todas las pantallas superpuestas.
enableScreens(true);

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
