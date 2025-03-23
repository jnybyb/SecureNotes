import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import SecurityScreen from './src/views/SecurityScreen';
import LoadingScreen from './src/views/LoadingScreen';
import NoteList from './src/views/NoteList';

const Stack = createStackNavigator();

function App(): React.JSX.Element {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleAnimationComplete = () => {
    setIsLoading(false);
  };

  const handleAuthenticated = () => {
    setIsAuthenticated(true);
  };

  return (
    <NavigationContainer>
      <Stack.Navigator 
        screenOptions={{ 
          headerShown: false,
          presentation: 'modal',
          animation: 'none' // This replaces animationEnabled
        }}
      >
        {isLoading ? (
          <Stack.Screen
            name="Loading"
            children={() => <LoadingScreen onAnimationComplete={handleAnimationComplete} />}
          />
        ) : isAuthenticated ? (
          <Stack.Screen 
            name="NoteList" 
            component={NoteList}
           // options={{ animation: 'slide_from_right' }} // This replaces animationEnabled
          />
        ) : (
          <Stack.Screen
            name="Security"
            children={() => <SecurityScreen onAuthenticated={handleAuthenticated} />}
            //options={{ animation: 'slide_from_right' }} // This replaces animationEnabled
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;