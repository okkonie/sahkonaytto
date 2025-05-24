import Loading from '@/components/loading';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { Dimensions, Modal, Pressable, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { checkAndFetchPrices, getDateStrings } from '../components/fetchprices';
import Switch from '../components/switch';
import "./global.css";

const { height, width } = Dimensions.get('window')

export default Home = () => {
  const [prices, setPrices] = useState(null);
  const [loading, setLoading] = useState(true);
  const [todayPrices, setTodayPrices] = useState([]);
  const [yesterdayPrices, setYesterdayPrices] = useState([]);
  const [tomorrowPrices, setTomorrowPrices] = useState([]);
  const [selectedDay, setSelectedDay] = useState('today');
  const [displayPrices, setDisplayPrices] = useState([]);
  const [addedPrices, setAddedPrices] = useState(0);
  const [isAlvOn, setAlvOn] = useState(true);
  const [values, setValues] = useState([7, 15, 22]);
  const [showSettings, setShowSettings] = useState(false);
  const [showAddedPrices, setShowAddedPrices] = useState(false);
  const [tempAddedPrices, setTempAddedPrices] = useState(0);
  

  const calculate = (price) => {
    const cents = price * 100;
    const added = parseFloat(addedPrices);
    const baseValue = cents + added;

    if (baseValue < 0) {
      // Round negative numbers to 2 decimals as string
      return baseValue.toFixed(2);
    }

    const valueWithAlv = isAlvOn ? 1.255 * baseValue : baseValue;
    return valueWithAlv.toFixed(2);
  };

  useEffect(() => {
    setLoading(true);

    const loadStoredValues = async () => {
      try {
        const [storedValues, storedAddedPrices, storedAlvOn] = await Promise.all([
          AsyncStorage.getItem('userValues'),
          AsyncStorage.getItem('addedPrices'),
          AsyncStorage.getItem('isAlvOn'),
        ]);

        if (storedValues) setValues(JSON.parse(storedValues));
        if (storedAddedPrices) setAddedPrices(JSON.parse(storedAddedPrices));
        if (storedAlvOn) setAlvOn(JSON.parse(storedAlvOn));
      } catch (error) {
        console.error('Error loading values from AsyncStorage:', error);
      }
    };

    const fetchAndSetPrices = async () => {
      try {
        const fetchedPrices = await checkAndFetchPrices();
        setPrices(fetchedPrices);
      } catch (error) {
        console.error('Error fetching prices:', error);
      }
    };

    const initialize = async () => {
      await loadStoredValues();
      await fetchAndSetPrices();
      setLoading(false); 
    };

    initialize(); 
  }, []);

  useEffect(() => {
    const checkTime = () => {
      if (prices) {
        
        const todayStr = getDateStrings().todayStr;
        const tomorrowStr = getDateStrings().tomorrowStr;
        const yesterdayStr = getDateStrings().yesterdayStr;
        const todayPrices = prices[todayStr] || [];
        setTodayPrices(todayPrices);
        const yesterdayPrices = prices[yesterdayStr] || [];
        setYesterdayPrices(yesterdayPrices);
        const tomorrowPrices = prices[tomorrowStr] || [];
        setTomorrowPrices(tomorrowPrices);

        const now = new Date();
        const futurePrices = [];

        Object.entries(prices).forEach(([dateKey, hourlyPrices]) => {
          hourlyPrices.forEach((entry) => {
            const timeEnd = new Date(entry.time_end);
            if (timeEnd > now) {
              futurePrices.push(entry);
            }
          });
        });
        setDisplayPrices(futurePrices);

        const tomorrow = getDateStrings().tomorrowStr;
        const hasTomorrowPrices = Object.keys(prices).includes(tomorrow);
        if (now.getHours() === 14 && !hasTomorrowPrices) {
          console.log('Fetching new prices');
          checkAndFetchPrices().then(setPrices);
        }
      }
    };
    checkTime();
    const interval = setInterval(checkTime, 60000);
    return () => clearInterval(interval);
  }, [prices]);

  const toggleAlv = () => {
    const newValue = !isAlvOn;
    setAlvOn(newValue);
    AsyncStorage.setItem('isAlvOn', JSON.stringify(newValue));
  };
  
  const getColor = (price) => {
    if (price >= values[2]) {
      return '#be185d';
    } else if (price >= values[1]) {
      return '#dc2626';
    } else if (price >= values[0]) {
      return '#eab308';
    };
    return '#16a34a';
  };

  const getBarHeight = (price) => {
    const maxPrice = Math.max(...displayPrices.map(p => p.EUR_per_kWh));
    if (calculate(maxPrice) > values[2]) {
      return `${(price / maxPrice) * 100}%`;
    }
    if (calculate(maxPrice) > values[1]) {
      return `${(price / maxPrice) * 70}%`;
    }
    if (calculate(maxPrice) > values[0]) {
      return `${(price / maxPrice) * 50}%`;
    }
    else {
      return `${(price / maxPrice) * 30}%`;
    }
  };

  const getNumbers = (prices) => {
    if (!prices || prices.length === 0) {
      return {
        max: { hour: '--', value: 0 },
        min: { hour: '--', value: 0 },
        avg: 0,
      };
    }
    const values = prices.map(entry => ({
      value: entry.EUR_per_kWh,
      hour: new Date(entry.time_start).getHours()
    }));

    const highestEntry = values.reduce((prev, curr) => curr.value > prev.value ? curr : prev);
    const lowestEntry = values.reduce((prev, curr) => curr.value < prev.value ? curr : prev);
    const average = values.reduce((sum, curr) => sum + curr.value, 0) / values.length;

    return {
      max: highestEntry,
      min: lowestEntry,
      avg: average,
    };
  };

  return (

    (loading || !prices || !displayPrices || !todayPrices) ? <Loading /> : (

      <View className='flex-1 bg-zinc-900 justify-between'>

        <StatusBar style='light'/>

        <ScrollView showsVerticalScrollIndicator={false} className='flex-1' bounces={false} overScrollMode="never">
          {displayPrices[0] && (
            <View 
              className='w-full items-center justify-end pt-8 rounded-b-[50] overflow-hidden shadow shadow-black'
              style={{backgroundColor: getColor(calculate(displayPrices[0].EUR_per_kWh)),
                borderColor: getColor(calculate(displayPrices[0].EUR_per_kWh)),
                borderWidth: 20,
              }}
            > 
              <View className='flex-row justify-between items-center w-full'>
                <Text className='pl-3 text-4xl font-[Black] text-white'>hinta nyt</Text>
                <TouchableOpacity onPress={() => setShowSettings(true)} className='pr-3 pl-7 py-8'>
                  <MaterialIcons name='settings' color="white" size={28}/>
                </TouchableOpacity>
              </View>

              <View className='w-full p-10 rounded-t-[30] flex-row items-end justify-between' style={{backgroundColor: 'rgba(0,0,0,0.3)'}}>
                <Text className='text-7xl font-[Black] text-white'>{(calculate(displayPrices[0].EUR_per_kWh))}</Text>
                <Text className='text-xl font-[Bold] text-white'>c/kWh</Text>
              </View>
            </View>
          )}

          <View className='w-full items-center pt-4'>
            <ScrollView 
              className='h-full rounded-3xl bg-zinc-800 overflow-hidden shadow shadow-black' 
              style={{ width: width * 0.95, height: height * 0.4 }} 
              contentContainerStyle={{
                paddingHorizontal: width * 0.02,
                paddingVertical: height * 0.015,
                gap: width * 0.02,
              }}
              horizontal
              showsHorizontalScrollIndicator={false}
              bounces={false}
              overScrollMode="never"
            >
              {displayPrices?.map((entry, index) => {
                const date = new Date(entry.time_start);
                const formattedTime = date.toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  hour12: false,
                });
                const adjustedPrice = calculate(entry.EUR_per_kWh);

                return (
                  <View key={entry.time_start} className='h-full justify-end items-center gap-1'>
                    <View className='flex-1 justify-end'>
                      <View 
                        style={{ 
                          height: getBarHeight(entry.EUR_per_kWh),
                          alignItems: 'center',
                          justifyContent: 'flex-end',
                          paddingBottom: height * 0.01,
                          minHeight: height * 0.03,
                          width: (0.81 / 6) * width,
                          borderRadius: 10,
                          backgroundColor: getColor(adjustedPrice),
                          borderCurve: 'circular',
                        }}
                      >
                        <Text className='text-xs text-white font-[Black]'>
                          {adjustedPrice}
                        </Text>
                      </View>
                    </View>
                    <Text className='text-md text-white font-[Bold]'>{formattedTime}</Text>
                  </View>
                );
              })}
            </ScrollView>
          </View>
          
          <View className='self-center mt-4 justify-between bg-zinc-800 rounded-2xl shadow shadow-black mb-8 overflow-hidden' style={{width: width * .95}}>

            <View className='flex-row justify-between items-center p-4 bg-zinc-800 shadow shadow-black'>
              <Pressable 
                onPress={() => setSelectedDay('yesterday')} 
                className='justify-center items-center rounded-full px-3 pb-1 w-1/3' 
                style={{backgroundColor: selectedDay === 'yesterday' ? 'rgba(0,0,0,0.3)'  : 'transparent'}}
              >
                <Text className='text-white text-md font-[Bold]'>Eilen</Text>
              </Pressable>
              <Pressable 
                onPress={() => setSelectedDay('today')} 
                className='justify-center items-center rounded-full px-3 pb-1 w-1/3' 
                style={{backgroundColor: selectedDay === 'today' ? 'rgba(0,0,0,0.3)'  : 'transparent'}}
              >
                <Text className='text-white text-md font-[Bold]'>Tänään</Text>
              </Pressable>
              <Pressable 
                onPress={() => setSelectedDay('tomorrow')} 
                className='justify-center items-center rounded-full px-3 pb-1 w-1/3' 
                style={{backgroundColor: selectedDay === 'tomorrow' ? 'rgba(0,0,0,0.3)'  : 'transparent'}}
              >
                <Text className='text-white text-md font-[Bold]'>Huomenna</Text>
              </Pressable>
            </View>

            {(() => {
              const selectedPrices = 
                selectedDay === 'yesterday' ? yesterdayPrices :
                selectedDay === 'today' ? todayPrices : tomorrowPrices;

              const { max, min, avg } = getNumbers(selectedPrices);

              if (!selectedPrices || selectedPrices.length === 0) {
                return (
                  <Text className='text-white mt-4 text-center'>Ei saatavilla olevia hintoja.</Text>
                );
              }
              return (
                <>
                  <View className='self-center py-6 px-2 flex-row justify-between border-b border-zinc-900' style={{width: width * .95}}>
                    <View className='w-1/3 items-center gap-1'>
                      <Text className='text-white text-sm font-[Bold]'>kallein klo {max.hour}</Text>
                      <Text className='text-2xl font-[Black]' style={{color: getColor(calculate(max.value))}}>{calculate(max.value)}</Text>
                    </View>
                    <View className='w-1/3 items-center gap-1 border-x border-zinc-900'>
                      <Text className='text-white text-sm font-[Bold]'>keskihinta</Text>
                      <Text className='text-2xl font-[Black]' style={{color: getColor(calculate(avg))}}>{calculate(avg)}</Text>
                    </View>
                    <View className='w-1/3 items-center gap-1'>
                      <Text className='text-white text-sm font-[Bold]'>halvin klo {min.hour}</Text>
                      <Text className='text-2xl font-[Black]' style={{color: getColor(calculate(min.value))}}>{calculate(min.value)}</Text>
                    </View>
                  </View>
                  {selectedPrices.map((entry) => {
                    const date = new Date(entry.time_start);
                    const formattedTime = date.toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      hour12: false,
                    });
                    const adjustedPrice = calculate(entry.EUR_per_kWh);

                    return (
                      <View key={entry.time_start} className='px-4 py-2 flex-row justify-between items-center w-full rounded-xl border-b border-zinc-900'>
                        <View className='flex-row items-center gap-2'>
                          <View style={{ backgroundColor: getColor(adjustedPrice) }} className='h-4 w-4 rounded-full' />
                          <Text className='text-md text-white font-[Bold]'>{formattedTime}</Text>
                        </View>
                        <Text className='text-md text-white font-[Bold] px-2 rounded-xl'>{adjustedPrice}</Text>
                      </View>
                    );
                  })}
                </>
              );
            })()}
          </View>
        </ScrollView>

        <Modal 
          visible={showSettings} 
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowSettings(false)}
        >
          <View className='flex-1 bg-transparent justify-end'>
            <View className="h-2/3 bg-zinc-800 shadow shadow-black rounded-t-3xl w-full overflow-hidden">
              <View className='w-full flex-row justify-between items-center mb-4 bg-zinc-800 shadow shadow-black'>
                <Text className='text-white text-xl font-[Black] pl-6'>ASETUKSET</Text>
                <TouchableOpacity onPress={() => setShowSettings(false)} className='p-6'>
                  <FontAwesome name="close" size={24} color='#fff' />
                </TouchableOpacity>
              </View>
              <View className='w-full flex-row justify-between items-center py-4 px-8'>
                <Text className='text-white text-md font-[Bold]'>näytä alv (25,5%)</Text>
                <Switch isOn={isAlvOn} onToggle={toggleAlv} activeColor='#16a34a' inactiveColor='#18181b' />
              </View>
              <View className='w-full flex-row justify-between items-center py-4 px-8'>
                <Text className='text-white text-md font-[Bold]'>lisäkulut</Text>
                <TouchableOpacity className='py-1 px-4 rounded-xl items-center justify-center border-b-2 border-zinc-900' onPress={() => setShowAddedPrices(true)}>
                  <Text className='text-white font-[Bold] text-lg text-center'>{addedPrices}</Text>
                </TouchableOpacity>
                {showAddedPrices && (
                  <Modal
                    transparent={true}
                    animationType="fade"
                    onRequestClose={() => setShowAddedPrices(false)}
                  >
                    <Pressable 
                      className='flex-1 justify-center items-center bg-transparent'
                      onPress={() => {setShowAddedPrices(false)}}
                    >
                      <View className='bg-zinc-900 p-4 rounded-xl flex-row justify-between w-2/3 items-center'>
                        <TextInput
                          className='text-white text-2xl font-[Black] flex-1'
                          value={tempAddedPrices === 0 ? '' : tempAddedPrices.toString()}
                          onChangeText={(text) => {
                            if (text === '') {
                              setTempAddedPrices(0);
                              return;
                            }
                            if (/^\d*\.?\d*$/.test(text)) {
                              setTempAddedPrices(text);
                            }
                            
                          }}
                          keyboardType="decimal-pad"
                          placeholder=""
                          placeholderTextColor="#ccc"
                          selectTextOnFocus={true}
                          cursorColor="#101012"
                          maxLength={6}
                          autoFocus={true}
                          onSubmitEditing={() => {
                            setShowAddedPrices(false); 
                            setAddedPrices(tempAddedPrices);
                            AsyncStorage.setItem('addedPrices', JSON.stringify(tempAddedPrices));
                          }}
                          returnKeyType="done"
                        />
                        <Text className='text-white text-lg font-[Bold]'>c/kWh</Text>
                      </View>
                    </Pressable>
                  </Modal>
                )}
                </View>
            </View>
          </View>
        </Modal>
      </View>
    )
  );
}
