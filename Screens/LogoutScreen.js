import { useEffect } from 'react';

export default function LogoutScreen({ navigation }) {
  useEffect(() => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  }, []);
  return null;
}