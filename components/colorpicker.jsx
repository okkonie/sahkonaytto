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

  const colors = [
    '#16a34a', '#4ade80', '#14532d', '#d4d4d4',
    '#eab308', '#fde047', '#a16207', '#a3a3a3',
    '#dc2626', '#f87171', '#7f1d1d', '#525252',
    '#be185d', '#f472b6', '#831843', '#262626',
    '#93c5fd', '#3b82f6', '#1d4ed8', '#1e3a8a'
  ];
  
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
              {colors.map((color) => (
                <TouchableOpacity
                  key={color}
                  className="w-[22%] h-10 rounded-lg mb-2"
                  style={{ backgroundColor: color, borderWidth: value.color === color ? 2 : 0, borderColor: '#fff' }}
                  onPress={() => {
                    value.price === 'default' && togglePicker();
                    onChange(color, value.price);
                  }}
                />
              ))}
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
