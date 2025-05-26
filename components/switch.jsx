import '@/app/global.css';
import { useEffect, useRef } from 'react';
import { Animated, TouchableOpacity, useWindowDimensions } from 'react-native';

export default function Switch({ isOn, onToggle, activeColor = '#83f07f', inactiveColor = '#ccc' }) {
  const { width } = useWindowDimensions();
  const switchTranslateX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(switchTranslateX, {
      toValue: isOn ? 22 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [isOn, width]);

  return (
    <TouchableOpacity
      className='w-[44] h-[22] p-[2] rounded-full flex-row items-center justify-start'
      style={{backgroundColor: isOn ? activeColor : inactiveColor}}
      onPress={onToggle}
    >
      <Animated.View 
        className='w-[18] h-[18] rounded-full bg-white'
        style={{ transform: [{ translateX: switchTranslateX }]}} 
      />
    </TouchableOpacity>
  );
}
