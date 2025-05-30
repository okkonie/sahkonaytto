import { FontAwesome, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'expo-image';
import { useKeepAwake } from 'expo-keep-awake';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Linking, Modal, Pressable, ScrollView, Switch, Text, TextInput, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ColorPicker from '../components/colorpicker';
import { checkAndFetchPrices, getDateStrings } from '../components/fetchprices';
import "./global.css";

export default Home = () => {
  const { width, height } = useWindowDimensions();
  const isPortrait = height > width;
  const [prices, setPrices] = useState(null);
  const pricesRef = useRef(prices);
  useEffect(() => {
    pricesRef.current = prices;
  }, [prices]);
  const [loading, setLoading] = useState(true);
  const [todayPrices, setTodayPrices] = useState([]);
  const [yesterdayPrices, setYesterdayPrices] = useState([]);
  const [tomorrowPrices, setTomorrowPrices] = useState([]);
  const [selectedDay, setSelectedDay] = useState('today');
  const [displayPrices, setDisplayPrices] = useState([]);
  const [isAlvOn, setAlvOn] = useState(true);
  const [isTaxOn, setIsTaxOn] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [addedPrices, setAddedPrices] = useState(0);
  const [showAddedPrices, setShowAddedPrices] = useState(false);
  const [tempAddedPrices, setTempAddedPrices] = useState(0);
  const [values, setValues] = useState([
      {price: 'default', 'color': '#16a34a'}, 
      {price: 10.0, 'color': '#eab308'},
      {price: 17.0, 'color': '#dc2626'}, 
      {price: 25.0, 'color': '#be185d'}
    ]);
  const [bg, setBg] = useState({'bg': '#18181b', 'top': '#27272a', 'text': '#ffffff', 'text2': '#a1a1aa'});

  // keep awake 
  const [keepAwake, setKeepAwake] = useState(false);
  function KeepAwakeToggle() {
    useKeepAwake();
    return null;
  }
  // animations
  const [layoutMeasurements, setLayoutMeasurements] = useState({}); 
  const slideAnim = useRef(new Animated.Value(0)).current;
  const slideWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!layoutMeasurements[selectedDay]) return;

    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: layoutMeasurements[selectedDay].x,
        duration: 100,
        useNativeDriver: false,
      }),
      Animated.timing(slideWidth, {
        toValue: layoutMeasurements[selectedDay].width,
        duration: 100,
        useNativeDriver: false,
      }),
    ]).start();
  }, [selectedDay, layoutMeasurements]);

  const calculate = (price) => {
    const cents = price * 100;
    const added = parseFloat(addedPrices);
    const baseValue = cents + added;
    const tax = 2.827515;

    if (baseValue < 0) {
      return isTaxOn ? (baseValue + tax).toFixed(2) : baseValue.toFixed(2);
    }

    const valueWithAlv = isAlvOn ? 1.255 * cents + added : baseValue;
    const endValue = isTaxOn ? valueWithAlv + tax : valueWithAlv
    return endValue.toFixed(2);
  };

  useEffect(() => {
    setLoading(true);

    const loadStoredValues = async () => {
      try {
        const [storedValues, storedAddedPrices, storedAlvOn, storedTaxOn, storedBg, storedKeepAwake] = await Promise.all([
          AsyncStorage.getItem('userValues'),
          AsyncStorage.getItem('addedPrices'),
          AsyncStorage.getItem('isAlvOn'),
          AsyncStorage.getItem('isTaxOn'),
          AsyncStorage.getItem('bg'),
          AsyncStorage.getItem('keepAwake'),
        ]);

        if (storedValues) setValues(JSON.parse(storedValues));
        if (storedAddedPrices) setAddedPrices(JSON.parse(storedAddedPrices));
        if (storedAlvOn) setAlvOn(JSON.parse(storedAlvOn));
        if (storedTaxOn) setIsTaxOn(JSON.parse(storedTaxOn));
        if (storedBg) setBg(JSON.parse(storedBg));
        if (storedKeepAwake) setKeepAwake(JSON.parse(storedKeepAwake));
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
      const currentPrices = pricesRef.current;
      if (!currentPrices) return;

      const now = new Date();
      const { tomorrowStr } = getDateStrings();

      const hasTomorrowPrices = currentPrices[tomorrowStr];

      if (now.getHours() >= 14 && !hasTomorrowPrices) {
        checkAndFetchPrices().then(setPrices).catch(console.error);
      }

      const futurePrices = [];
      Object.entries(currentPrices).forEach(([_, hourlyPrices]) => {
        hourlyPrices.forEach((entry) => {
          const timeEnd = new Date(entry.time_end);
          if (timeEnd > now) {
            futurePrices.push(entry);
          }
        });
      });
      setDisplayPrices(futurePrices);
    };
    
    checkTime();
    const interval = setInterval(checkTime, 60000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!prices) return;

    const { todayStr, yesterdayStr, tomorrowStr } = getDateStrings();
    const now = new Date();
    
    setTodayPrices(prices[todayStr] || []);
    setYesterdayPrices(prices[yesterdayStr] || []);
    setTomorrowPrices(prices[tomorrowStr] || []);

    const futurePrices = [];
      Object.entries(prices).forEach(([_, hourlyPrices]) => {
        hourlyPrices.forEach((entry) => {
          const timeEnd = new Date(entry.time_end);
          if (timeEnd > now) {
            futurePrices.push(entry);
          }
        });
      });
      setDisplayPrices(futurePrices);
  }, [prices]);

  const toggleAlv = () => {
    setAlvOn((prev) => !prev);
    AsyncStorage.setItem('isAlvOn', JSON.stringify(!isAlvOn));
  };

  const toggleTax = () => {
    setIsTaxOn(prev => !prev);
    AsyncStorage.setItem('isTaxOn', JSON.stringify(!isTaxOn));
  };

  const toggleBg = (newBg) => {
    setBg(newBg);
    AsyncStorage.setItem('bg', JSON.stringify(newBg));
  };

  const toggleKeepAwake = async () => {
    const next = !keepAwake;
    setKeepAwake(next);
    await AsyncStorage.setItem('keepAwake', JSON.stringify(next));
  };
  
  const getColor = (price) => {
    if (price >= values[3].price) {
      return values[3].color;
    } else if (price >= values[2].price) {
      return values[2].color;
    } else if (price >= values[1].price) {
      return values[1].color;
    };
    return values[0].color;
  };

  const getBarHeight = (price) => {
    const realPrice = calculate(price);
    const maxPrice = Math.max(...displayPrices.map(i => calculate(i.EUR_per_kWh)));
    if (realPrice <= 0 || maxPrice <= 0) return 0;
    if (maxPrice >= values[3].price) return (realPrice * 95) / maxPrice + '%';
    if (maxPrice >= values[2].price) return (realPrice * 70) / maxPrice + '%';
    if (maxPrice >= values[1].price) return (realPrice * 55) / maxPrice + '%';
    return (realPrice * 35) / maxPrice + '%';
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

  const handleChange = (newColor, newPrice, index) => {
    const updated = [...values];
    updated[index] = {
      ...updated[index],
      color: newColor,
      price: newPrice || 0,
    };
    AsyncStorage.setItem('userValues', JSON.stringify(updated));
    setValues(updated);
  };

  const lowerColor = bg.bg;
  const upperColor = (!displayPrices[0]?.EUR_per_kWh || !isPortrait)
    ? bg.bg
    : getColor(calculate(displayPrices[0].EUR_per_kWh));

  return (
    (loading || !prices || !displayPrices || !todayPrices) ? (
      <View className='flex-1 items-center justify-center bg-[#16A34A]' />
      ) : (

      <View style={{flex: 1, backgroundColor: 'black' }}>

        <View style={{height: 0.5 * height, width: '100%', position: 'absolute', top: -1, backgroundColor: upperColor}} />
        <View style={{height: 0.5 * height, width: '100%', position: 'absolute', bottom: -1, backgroundColor: lowerColor}} />
        <StatusBar style='light' />

        {keepAwake && <KeepAwakeToggle />}

        <SafeAreaView className='flex-1' style={{backgroundColor: 'transparent'}}>

          <ScrollView showsVerticalScrollIndicator={false} className='flex-1' contentContainerStyle={{backgroundColor: bg.bg}} bounces={false} overScrollMode="never">

            <View style={{ width: '100%', flexDirection: isPortrait ? 'column' : 'row', justifyContent: 'space-between', alignSelf: 'center' }}>

              {displayPrices[0] && (
                <View 
                  className='justify-end items-center pt-[5] pb-[20] px-[20] overflow-hidden shadow shadow-black'
                  style={{
                    borderBottomLeftRadius: 40,
                    borderBottomRightRadius: 40,
                    borderTopLeftRadius: !isPortrait && 40,
                    borderTopRightRadius: !isPortrait && 40,
                    width: isPortrait ? '100%' : width * 0.4,
                    backgroundColor: getColor(calculate(displayPrices[0].EUR_per_kWh)),
                    borderColor: getColor(calculate(displayPrices[0].EUR_per_kWh)),
                  }}
                > 
                  <View className='flex-row justify-between items-center w-full'>
                    <Text className='pl-3 text-4xl font-[Black] text-white'>hinta nyt</Text>
                    <TouchableOpacity onPress={() => setShowSettings(true)} className='pr-3 pl-7 py-8'>
                      <MaterialIcons name='settings' color="white" size={28}/>
                    </TouchableOpacity>
                  </View>

                  <View 
                    className='w-full p-10 rounded-[30] items-end justify-between' 
                    style={{backgroundColor: 'rgba(0,0,0,0.3)', flexDirection: isPortrait ? 'row' : 'column', alignItems: isPortrait ? 'flex-end' : 'flex-start'}}
                  >
                    <Text className='text-7xl font-[Black] text-white'>{(calculate(displayPrices[0].EUR_per_kWh))}</Text>
                    <Text className='text-xl font-[Bold] text-white'>c/kWh</Text>
                  </View>
                </View>
              )}

              <View className='items-center' style={{ flex: 1, marginTop: isPortrait ? height * 0.02 : 0 }}>
                <ScrollView 
                  className=' rounded-3xl shadow shadow-black overflow-hidden' 
                  style={{ width: '95%', height: height * 0.4, backgroundColor: bg.top }} 
                  contentContainerStyle={{
                    paddingHorizontal: isPortrait ? width * 0.02 : width * 0.01,
                    paddingVertical: height * 0.02,
                  }}
                  horizontal
                  showsHorizontalScrollIndicator={true}
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
                      <View key={entry.time_start} className='h-full justify-end items-center gap-1' style={{ width: isPortrait ? width * 0.13 : width * 0.073 }}>
                        <View className='justify-end items-center gap-1' style={{ height: getBarHeight(entry.EUR_per_kWh), minHeight: isPortrait ? height * 0.035 : height * 0.07, maxHeight: '95%' }}>
                          <Text className='text-xs font-[Bold]' style={{color: bg.text}}>
                            {adjustedPrice}
                          </Text>
                          <View 
                            className='flex-1 justify-end h-full rounded-full'
                            style={{backgroundColor: getColor(adjustedPrice), width: isPortrait ? width * 0.07 : width * 0.04}}
                          />
                        </View>
                        <Text className='text-md font-[Bold]' style={{color: bg.text}}>{formattedTime}</Text>
                      </View>
                    );
                  })}
                </ScrollView>
              </View>
              
            </View>
            
            <View 
              className='self-center mt-4 justify-between rounded-2xl shadow shadow-black mb-8 overflow-hidden' 
              style={{width: '95%', backgroundColor: bg.top}}
            >

              <View className='flex-row justify-between items-center py-4 px-2 shadow shadow-black' style={{ backgroundColor: bg.top, position: 'relative' }}>
                <Animated.View
                  style={{
                    position: 'absolute',
                    top: 4,
                    bottom: 4,
                    left: 0,
                    borderRadius: 999,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    transform: [{ translateX: slideAnim }],
                    width: slideWidth,
                    zIndex: 0,
                  }}
                />
                
                {/* Buttons */}
                {['yesterday', 'today', 'tomorrow'].map((day) => (
                  <Pressable
                    key={day}
                    onLayout={({ nativeEvent }) => {
                      const { x, width } = nativeEvent.layout;
                      setLayoutMeasurements((prev) => ({ ...prev, [day]: { x, width } }));
                    }}
                    onPress={() => setSelectedDay(day)}
                    style={{
                      flex: 1,
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 1,
                    }}
                  >
                    <Text style={{ color: bg.text, fontWeight: 'bold' }}>
                      {day === 'yesterday' ? 'Eilen' : day === 'today' ? 'Tänään' : 'Huomenna'}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {(() => {
                const selectedPrices = 
                  selectedDay === 'yesterday' ? yesterdayPrices :
                  selectedDay === 'today' ? todayPrices : tomorrowPrices;

                const { max, min, avg } = getNumbers(selectedPrices);

                if (!selectedPrices || selectedPrices.length === 0) {
                  return (
                    <Text className=' my-4 text-center font-[Medium] pt-12 pb-40' style={{color: bg.text}}>Ei hintoja saatavilla.</Text>
                  );
                }
                return (
                  <>
                    <View className='self-center py-6 px-2 flex-row justify-between' style={{width: width * .95}}>
                      <View className='w-1/3 items-center gap-1'>
                        <Text className=' text-sm font-[Bold]' style={{color: bg.text}}>kallein klo {max.hour}</Text>
                        <Text className='text-3xl font-[Black]' style={{color: getColor(calculate(max.value))}}>{calculate(max.value)}</Text>
                      </View>
                      <View className='w-1/3 items-center gap-1 border-x border-[rgba(0,0,0,0.3)]'>
                        <Text className='text-sm font-[Bold]' style={{color: bg.text}}>keskihinta</Text>
                        <Text className='text-3xl font-[Black]' style={{color: getColor(calculate(avg))}}>{calculate(avg)}</Text>
                      </View>
                      <View className='w-1/3 items-center gap-1'>
                        <Text className='text-sm font-[Bold]' style={{color: bg.text}}>halvin klo {min.hour}</Text>
                        <Text className='text-3xl font-[Black]' style={{color: getColor(calculate(min.value))}}>{calculate(min.value)}</Text>
                      </View>
                    </View>
                    <View className='pb-2'>
                    {selectedPrices.map((entry) => {
                      const date = new Date(entry.time_start);
                      const formattedTime = date.toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        hour12: false,
                      });
                      const maxPrice = Math.max(...selectedPrices.map(e => calculate(e.EUR_per_kWh)));
                      const adjustedPrice = calculate(entry.EUR_per_kWh);
                      const x = maxPrice >= values[3].price ? 100 : maxPrice >= values[2].price ? 70 : maxPrice >= values[1].price ? 55 : 40;
                      const widthPercentage = adjustedPrice <= 0 ? 0 : (adjustedPrice * x) / maxPrice;

                      return (
                        <View
                          key={entry.time_start} 
                          className='px-8 py-3 flex-row justify-between items-center w-full self-center border-t border-[rgba(0,0,0,0.2)]'
                        >
                          <View className=' w-24 justify-between pr-5 flex-row items-center'>
                            <Text className='text-md font-[Medium]' style={{color: bg.text}}>{formattedTime} : </Text>
                            <Text className='text-md font-[Medium] rounded-xl text-right' style={{color: bg.text}}>{adjustedPrice}</Text>
                          </View>
                          <View className='justify-center flex-1'>
                            <View className='flex-1 justify-center'>
                              <View 
                                style={{ backgroundColor: getColor(adjustedPrice), minWidth: '10%', width: `${widthPercentage}%` }} 
                                className='h-2 rounded-full' 
                              />
                            </View>
                          </View>
                        </View>
                      );
                    })}
                    </View>
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
              <View className="shadow shadow-black rounded-t-3xl w-full overflow-hidden" backgroundColor={bg.top} style={{backgroundColor: bg.top, height: isPortrait ? '85%' : '100%'}}>
                <View className='w-full flex-row justify-between items-center mb-4 shadow shadow-black' backgroundColor={bg.top}>
                  <Text className='text-xl font-[Black] pl-6' style={{color: bg.text}}>ASETUKSET</Text>
                  <TouchableOpacity onPress={() => setShowSettings(false)} className='p-6'>
                    <FontAwesome name="close" size={24} color={bg.text} />
                  </TouchableOpacity>
                </View>
                <ScrollView className='flex-1' showsVerticalScrollIndicator={false} bounces={false} overScrollMode="never">
                  <View className='w-full flex-row justify-between items-center py-4 px-8'>
                    <View className='gap-1'>
                      <Text className='text-md font-[Medium]' style={{color: bg.text}}>estä näytön sammuminen</Text>
                    </View>
                    <Switch value={keepAwake} onValueChange={toggleKeepAwake} trackColor={{ false: bg.text2, true: '#16a34a' }} thumbColor={'#fff'} />
                  </View>
                  <View className='w-full flex-row justify-between items-center py-4 px-8'>
                    <View className='gap-1'>
                      <Text className='text-md font-[Medium]' style={{color: bg.text}}>näytä alv hinnassa</Text>
                      <Text className='text-sm' style={{color: bg.text2}}>25,5%</Text>
                    </View>
                    <Switch value={isAlvOn} onValueChange={toggleAlv} trackColor={{ false: bg.text2, true: '#16a34a' }} thumbColor={'#fff'} />
                  </View>
                  <View className='w-full flex-row justify-between items-center py-4 px-8'>
                    <View className='gap-1'>
                      <Text className='text-md font-[Medium]' style={{color: bg.text}}>näytä sähkövero</Text>
                      <Text className='text-sm' style={{color: bg.text2}}>~ 2,83 c/kWh</Text>
                    </View>
                    <Switch value={isTaxOn} onValueChange={toggleTax} trackColor={{ false: bg.text2, true: '#16a34a' }} thumbColor={'#fff'} />
                  </View>
                  <View className='w-full flex-row justify-between items-center py-4 px-8'>
                    <View className='gap-1'>
                      <Text className='text-md font-[Medium]' style={{color: bg.text}}>lisäkulut</Text>
                      <Text className='text-sm' style={{color: bg.text2}}>siirtohinta, marginaali...</Text>
                    </View>
                    <TouchableOpacity className='items-center justify-center' onPress={() => setShowAddedPrices(true)}>
                      <Text className='font-[Bold] text-lg text-center' style={{color: bg.text}}>{addedPrices}</Text>
                      <View className='h-1 w-12 rounded-full' style={{backgroundColor: bg.text2}}/>
                    </TouchableOpacity>
                    {showAddedPrices && (
                      <Modal
                        transparent={true}
                        animationType="fade"
                        onRequestClose={() => setShowAddedPrices(false)}
                      >
                        <Pressable 
                          className='flex-1 justify-center items-center bg-[rgba(0,0,0,0.4)]'
                          onPress={() => {setShowAddedPrices(false)}}
                        >
                          <View className='p-4 rounded-xl flex-row justify-between w-2/3 items-center' style={{backgroundColor: bg.top}}>
                            <TextInput
                              className='text-2xl font-[Black] flex-1'
                              style={{color: bg.text}}
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
                              cursorColor={bg.text2}
                              maxLength={6}
                              autoFocus={true}
                              onSubmitEditing={() => {
                                setShowAddedPrices(false); 
                                setAddedPrices(tempAddedPrices);
                                AsyncStorage.setItem('addedPrices', JSON.stringify(tempAddedPrices));
                              }}
                              returnKeyType="done"
                            />
                            <Text className=' text-lg font-[Bold]' style={{color: bg.text}}>c/kWh</Text>
                          </View>
                        </Pressable>
                      </Modal>
                    )}
                  </View>
                  <View className='w-full flex-row justify-between items-center py-4 px-8'>
                    <Text className='text-md font-[Medium]' style={{color: bg.text}}>Teema</Text>
                    <View className='flex-row items-center gap-2'>
                      <TouchableOpacity 
                        onPress={() => toggleBg({'bg': '#d4d4d8', 'top': '#e4e4e7', 'text': '#262626', 'text2': '#737373'})}
                        className='h-8 w-12 rounded-md bg-zinc-300'
                        style={{
                          borderColor: bg.bg === '#d4d4d8' ? bg.text2 : 'transparent',
                          borderWidth: bg.bg === '#d4d4d8' ? 2 : 0,
                        }}
                      />
                      <TouchableOpacity 
                        onPress={() => toggleBg({'bg': '#18181b', 'top': '#27272a', 'text': '#ffffff', 'text2': '#a1a1aa'})}
                        className='h-8 w-12 rounded-md bg-zinc-700'
                        style={{
                          borderColor: bg.bg === '#18181b' ? bg.text2 : 'transparent',
                          borderWidth: bg.bg === '#18181b' ? 2 : 0,
                        }}
                      />
                      <TouchableOpacity 
                        onPress={() => toggleBg({'bg': '#000', 'top': '#171717', 'text': '#fff', 'text2': '#a3a3a3'})}
                        className='h-8 w-12 rounded-md bg-neutral-900'
                        style={{
                          borderColor: bg.bg === '#000' ? bg.text2 : 'transparent',
                          borderWidth: bg.bg === '#000' ? 2 : 0,
                        }}
                      />
                    </View>
                  </View>
                  <View className='w-full flex-row justify-between items-center py-4 px-8'>
                    <Text className='text-md font-[Medium]' style={{color: bg.text}}>Värit</Text>
                    <View className='flex-row items-center gap-2'>
                      {values.map((item, index) => (
                        <ColorPicker
                          key={index}
                          value={item}
                          bg={bg}
                          onChange={(newColor, newPrice) => handleChange(newColor, newPrice, index)}
                        />
                      ))}
                    </View>
                  </View>
                  <View className='w-full flex-row items-center justify-center pt-12 p-4'>
                    <Pressable
                      onPress={() => Linking.openURL('https://www.sahkonhintatanaan.fi')}
                      accessibilityRole="link"
                    >
                      <Image
                        source={{ uri: 'https://i.bnfcl.io/finland/badge-suomi_DDK-AJUxQ.png' }}
                        style={{ width: 200, height: 45, alignSelf: 'center' }}
                        contentFit="contain"
                        placeholder="blurhash"
                        transition={100}
                      />
                    </Pressable>
                  </View>
                </ScrollView>
              </View>
            </View>
          </Modal>
        </SafeAreaView>
      </View>
    )
  );
}
