import '@/app/global.css';
import { useState } from 'react';
import { Modal, Pressable, Text, TextInput, TouchableOpacity, View } from 'react-native';

const ColorPicker = ({ bg, value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tempPrice, setTempPrice] = useState(value.price);

  const togglePicker = () => setIsOpen(!isOpen);

  const handleSubmit = () => {
    togglePicker();
    onChange(value.color, parseFloat(tempPrice));
  };

  return (
    <>
      <TouchableOpacity className="items-center justify-center" onPress={togglePicker}>
        <Text className="font-[Bold] text-lg text-center" style={{ color: bg.text }}>
          {value.price === 'default' ? '<' : value.price}
        </Text>
        <View className="h-1 w-12 rounded-full" style={{ backgroundColor: value.color }} />
      </TouchableOpacity>

      {isOpen && (
        <Modal transparent animationType="fade" onRequestClose={togglePicker}>
          <Pressable
            className="flex-1 justify-center items-center bg-[rgba(0,0,0,0.4)]"
            onPress={togglePicker}
          > 
            <View className="w-2/3 justify-between flex-wrap flex-row rounded-xl">
              <TouchableOpacity className='w-[23%] h-10 mb-2 rounded-md bg-green-600' onPress={() => onChange('#16a34a', value.price)}/>
              <TouchableOpacity className='w-[23%] h-10 mb-2 rounded-md bg-green-300' onPress={() => onChange('#86efac', value.price)}/>
              <TouchableOpacity className='w-[23%] h-10 mb-2 rounded-md bg-green-800' onPress={() => onChange('#14532d', value.price)}/>
              <TouchableOpacity className='w-[23%] h-10 mb-2 rounded-md bg-neutral-300' onPress={() => onChange('#d4d4d4', value.price)}/>
              <TouchableOpacity className='w-[23%] h-10 mb-2 rounded-md bg-yellow-500' onPress={() => onChange('#eab308', value.price)}/>
              <TouchableOpacity className='w-[23%] h-10 mb-2 rounded-md bg-yellow-300' onPress={() => onChange('#fde047', value.price)}/>
              <TouchableOpacity className='w-[23%] h-10 mb-2 rounded-md bg-yellow-700' onPress={() => onChange('#a16207', value.price)}/>
              <TouchableOpacity className='w-[23%] h-10 mb-2 rounded-md bg-neutral-400' onPress={() => onChange('#a3a3a3', value.price)}/>
              <TouchableOpacity className='w-[23%] h-10 mb-2 rounded-md bg-red-600' onPress={() => onChange('#dc2626', value.price)}/>
              <TouchableOpacity className='w-[23%] h-10 mb-2 rounded-md bg-red-400' onPress={() => onChange('#f87171', value.price)}/>
              <TouchableOpacity className='w-[23%] h-10 mb-2 rounded-md bg-red-900' onPress={() => onChange('#7f1d1d', value.price)}/>
              <TouchableOpacity className='w-[23%] h-10 mb-2 rounded-md bg-neutral-600' onPress={() => onChange('#525252', value.price)}/>
              <TouchableOpacity className='w-[23%] h-10 mb-2 rounded-md bg-pink-700' onPress={() => onChange('#be185d', value.price)}/>
              <TouchableOpacity className='w-[23%] h-10 mb-2 rounded-md bg-pink-400' onPress={() => onChange('#f472b6', value.price)}/>
              <TouchableOpacity className='w-[23%] h-10 mb-2 rounded-md bg-pink-900' onPress={() => onChange('#831843', value.price)}/>
              <TouchableOpacity className='w-[23%] h-10 mb-2 rounded-md bg-neutral-800' onPress={() => onChange('#262626', value.price)}/>
              <TouchableOpacity className='w-[23%] h-10 mb-2 rounded-md bg-blue-300' onPress={() => onChange('#93c5fd', value.price)}/>
              <TouchableOpacity className='w-[23%] h-10 mb-2 rounded-md bg-blue-500' onPress={() => onChange('#3b82f6', value.price)}/>
              <TouchableOpacity className='w-[23%] h-10 mb-2 rounded-md bg-blue-700' onPress={() => onChange('#1d4ed8', value.price)}/>
              <TouchableOpacity className='w-[23%] h-10 mb-2 rounded-md bg-blue-900' onPress={() => onChange('#1e3a8a', value.price)}/>
            </View>
            {value.price !== 'default' && (
              <View
                className="p-4 rounded-xl flex-row justify-between w-2/3 items-center"
                style={{ backgroundColor: bg.top }}
              >
                <TextInput
                  className="text-2xl font-[Black] flex-1"
                  style={{ color: bg.text }}
                  value={tempPrice === 0 ? '' : tempPrice.toString()}
                  onChangeText={(text) => {
                    if (text === '') {
                      setTempPrice(0);
                      return;
                    }
                    if (/^\d*\.?\d*$/.test(text)) {
                      setTempPrice(text);
                    }
                  }}
                  keyboardType="decimal-pad"
                  selectTextOnFocus
                  cursorColor={bg.text2}
                  maxLength={6}
                  autoFocus
                  onSubmitEditing={handleSubmit}
                  returnKeyType="done"
                />
                <Text className="text-lg font-[Bold]" style={{ color: bg.text }}>
                  c/kWh
                </Text>
              </View>
            )}
          </Pressable>
        </Modal>
      )}
    </>
  );
};

export default ColorPicker;
