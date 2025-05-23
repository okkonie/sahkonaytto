import { Feather, MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { Dimensions, FlatList, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { checkAndFetchPrices } from '../components/fetchprices';
import Loading from '../components/loading';
import Switch from '../components/switch';
import "./global.css";

const { height, width } = Dimensions.get('window')


export default Home = () => {
  const [prices, setPrices] = useState(null);
  const [displayPrices, setDisplayPrices] = useState(null);
  const [zoom, setZoom] = useState(10);
  const [addedPrices, setAddedPrices] = useState(0);
  const [tempAddedPrices, setTempAddedPrices] = useState(0);
  const [isAlvOn, setAlvOn] = useState(true);
  const [selectedTime, setSelectedTime] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showZoomDropdown, setShowZoomDropdown] = useState(false);
  const [showAddedPrices, setShowAddedPrices] = useState(false);
  const [values, setValues] = useState([7, 15, 22]);
  const [changeValues, setChangeValues] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [tempValue, setTempValue] = useState('');
  const [maxMin, setMaxMin] = useState([])
  const [avg, setAvg] = useState(0)
  const zoomOptions = Array.from({ length: 11 }, (_, i) => i + 5);

  const calculateAlvAndAddedPrices = (price) => {
    if (price + parseFloat(addedPrices) < 0) {
      return price + parseFloat(addedPrices);
    }
    return (price + parseFloat(addedPrices)) / (isAlvOn ? 1 : 1.255);
  };

  useEffect(() => {
    const fetchPrices = async () => {
      const fetchedPrices = await checkAndFetchPrices();
      setPrices(fetchedPrices);
      PriceStorage.savePrices(JSON.stringify(fetchedPrices));
      PriceStorage.updateWidget();
    };
    fetchPrices();
  }, []);

  useEffect(() => {
    const checkTime = () => {
      const now = new Date();
      
      if (prices) {
        const displayedPrices = Object.entries(prices)
          .filter(([dateTime]) => {
            const priceDate = new Date(dateTime);
            return priceDate >= now || (priceDate.getDate() === now.getDate() && priceDate.getHours() === now.getHours());
          })
          .sort(([dateA], [dateB]) => new Date(dateA) - new Date(dateB));
        
        setDisplayPrices(displayedPrices);

        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const hasTomorrowPrices = Object.keys(prices).some(dateTime => {
          const priceDate = new Date(dateTime);
          return priceDate.getDate() === tomorrow.getDate() && 
                 priceDate.getMonth() === tomorrow.getMonth() && 
                 priceDate.getFullYear() === tomorrow.getFullYear();
        });

        if (now.getHours() === 14 && !hasTomorrowPrices) {
          console.log('Fetching new prices');
          checkAndFetchPrices().then(setPrices);
        }

        const todayEntries = Object.entries(prices)
          .map(([utcString, value]) => {
            const date = new Date(utcString);
            return {
              utc: utcString,
              localDate: date.toLocaleDateString('fi-FI'),
              localTime: date.toLocaleTimeString('fi-FI', {
                hour: '2-digit'
              }),
              value,
            };
          })
          .filter(entry => entry.localDate === new Date().toLocaleDateString('fi-FI'));

        if (todayEntries.length !== 0) {
          const values = todayEntries.map(e => e.value);
          const min = calculateAlvAndAddedPrices(Math.min(...values));
          const max = calculateAlvAndAddedPrices(Math.max(...values));
          const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
          const minEntry = todayEntries.find(e => e.value === min);
          const maxEntry = todayEntries.find(e => e.value === max);
          setMaxMin([maxEntry, minEntry])
          setAvg(avg)
        }
      };
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

  useEffect(() => {
    const loadValues = async () => {
      try {
        const storedValues = await AsyncStorage.getItem('userValues');
        const storedZoom = await AsyncStorage.getItem('zoom');
        const storedAddedPrices = await AsyncStorage.getItem('addedPrices');
        const storedAlvOn = await AsyncStorage.getItem('isAlvOn');
        if (storedValues !== null) {
          setValues(JSON.parse(storedValues));
        }
        if (storedZoom !== null) {
          setZoom(JSON.parse(storedZoom));
        }
        if (storedAddedPrices !== null) {
          setAddedPrices(JSON.parse(storedAddedPrices));
        }
        if (storedAlvOn !== null) {
          setAlvOn(JSON.parse(storedAlvOn));
        }
      } catch (error) {
        console.error('Error loading values from AsyncStorage', error);
      }
    };
  
    loadValues();
  }, []);

  const getHour = (dateStr) => {
    const date = new Date(dateStr);
    const hour = date.getHours();
    return hour
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
    const maxPrice = Math.max(...displayPrices.map(([_, price]) => calculateAlvAndAddedPrices(price)));
      if (maxPrice >= values[2]) {
        return (price / maxPrice) * 100 + '%'
      } else if (maxPrice >= values[1]) {
        return (price / maxPrice) * 70 + '%'
      } else if (maxPrice >= values[0]) {
        return (price / maxPrice) * 40 + '%'
      }
      else return (price / maxPrice) * 20 + '%'
  };

  const renderColorButton = (index) => {
    return (
      <TouchableOpacity
        style={{ alignItems: 'center' }}
        onPress={() => {
          setSelectedIndex(index);
          setTempValue(values[index].toString());
          setChangeValues(true);
        }}
      >
        <Text style={[styles.contentText, { color: 'white' }]}>
          {values[index]}
        </Text>
        <View
          style={{
            width: 30,
            height: 4,
            borderRadius: 2,
            backgroundColor:
              index === 0 ? '#facf5a' : index === 1 ? '#fa5a5a' : '#f241c9',
          }}
        />
      </TouchableOpacity>
    );
  };

  if (!displayPrices || Object.keys(displayPrices).length === 0) {
    return <Loading />;
  }

  return (
    <View className='flex-1 bg-zinc-900 justify-between'>

      <StatusBar style='light'/>

      <View className='flex-1'>

        <View 
          className='w-full items-center justify-end pt-8 rounded-b-[50] overflow-hidden shadow shadow-black'
          style={{backgroundColor: !selectedTime ? getColor(calculateAlvAndAddedPrices(displayPrices[0]?.[1])) : getColor(calculateAlvAndAddedPrices(displayPrices?.find(([dateTime]) => dateTime === selectedTime)?.[1])),
            borderColor: !selectedTime ? getColor(calculateAlvAndAddedPrices(displayPrices[0]?.[1])) : getColor(calculateAlvAndAddedPrices(displayPrices?.find(([dateTime]) => dateTime === selectedTime)?.[1])),
            borderWidth: 20,
          }}
        > 
          <View className='flex-row justify-between items-center w-full'>
            <Text className='pl-3 text-4xl font-[Black] text-white'>{!selectedTime ? 'hinta nyt' : `hinta klo ${getHour(selectedTime)}`}</Text>
            <TouchableOpacity onPress={() => setShowSettings(true)} className='pr-3 pl-7 py-8'>
              <MaterialIcons name='settings' color="white" size={28}/>
            </TouchableOpacity>
          </View>
          <View className='w-full p-10 rounded-t-[30] flex-row items-end justify-between' style={{backgroundColor: 'rgba(0,0,0,0.3)'}}>
            <Text className='text-7xl font-[Black] text-white'>
              {selectedTime 
                ? (calculateAlvAndAddedPrices(displayPrices?.find(([dateTime]) => dateTime === selectedTime)?.[1]).toFixed(2))
                : (calculateAlvAndAddedPrices(displayPrices?.[0]?.[1]).toFixed(2))}
            </Text>
            <Text className='text-xl font-[Bold] text-white'>c/kWh</Text>
          </View>
        </View>

        <View className='w-full items-center pt-4'>
          <ScrollView 
            className='h-full rounded-3xl bg-zinc-800 overflow-hidden shadow shadow-black' 
            style={{width: width * .95, height: height * 0.4}} 
            contentContainerStyle={{paddingHorizontal: width * 0.02, paddingVertical: height * 0.015, gap: width * 0.02}}
            horizontal
            showsHorizontalScrollIndicator={false}
            bounces={false}
            overScrollMode="never"
          >
            {displayPrices?.map(([dateTime, price], index) => {
              const isFirstBar = index === 0;
              const date = new Date(dateTime);
              const formattedTime = date.toLocaleTimeString('us-US', {
                hour: '2-digit',
                hour12: false,
              });
              return (
                <View key={dateTime} className='h-full justify-end items-center gap-1'>
                  <View className='flex-1 justify-end'>
                    <View 
                      style={{ 
                        height: getBarHeight(calculateAlvAndAddedPrices(price)),
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        paddingBottom: height * 0.01,
                        minHeight: height * 0.03,
                        width: ((0.81) / 6) * width,
                        borderRadius: 10,
                        backgroundColor: getColor(calculateAlvAndAddedPrices(price)),
                        borderCurve: 'circular',
                      }}
                    >
                      <Text className='text-xs text-white font-[Black]'>{calculateAlvAndAddedPrices(price).toFixed(2)}</Text>
                    </View>
                  </View>
                  <Text className='text-md text-white font-[Bold]'>{formattedTime}</Text>
                </View>
              );
            })}
          </ScrollView>
        </View>
        
        {maxMin.length !== 0 && avg && (
          <View className='self-center mt-4 p-4 flex-row justify-between bg-zinc-800 rounded-2xl shadow shadow-black' style={{width: width * .95}}>
            <View className='w-1/3 items-center gap-1'>
              <Text className='text-white text-sm font-[Bold]'>korkein klo {maxMin[0].localTime}</Text>
              <Text className='text-2xl font-[Black]' style={{color: getColor(calculateAlvAndAddedPrices(maxMin[0].value))}}>{calculateAlvAndAddedPrices(maxMin[0].value).toFixed(2)}</Text>
            </View>
            <View className='w-1/3 items-center gap-1 border-x border-zinc-900'>
              <Text className='text-white text-sm font-[Bold]'>keskihinta</Text>
              <Text className='text-2xl font-[Black]' style={{color: getColor(avg)}}>{calculateAlvAndAddedPrices(avg).toFixed(2)}</Text>
            </View>
            <View className='w-1/3 items-center gap-1'>
              <Text className='text-white text-sm font-[Bold]'>alin klo {maxMin[1].localTime}</Text>
              <Text className='text-2xl font-[Black]' style={{color: getColor(calculateAlvAndAddedPrices(maxMin[1].value))}}>{calculateAlvAndAddedPrices(maxMin[1].value).toFixed(2)}</Text>
            </View>
          </View>
        )}

      </View>

      
      <Modal 
        visible={showSettings} 
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSettings(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.settingsContainer}>
            <View style={styles.header}>
              <Text style={styles.headerText}>ASETUKSET</Text>
              <TouchableOpacity onPress={() => setShowSettings(false)}>
                <Feather name="x" size={24} color='#ccc' />
              </TouchableOpacity>
            </View>
            <View style={styles.settingRow}>
              <Text style={styles.contentText}>näytä alv (25,5%)</Text>
              <Switch isOn={isAlvOn} onToggle={toggleAlv} activeColor='#83f07f' inactiveColor='#ccc' />
            </View>
            <View style={styles.settingRow}>
              <Text style={styles.contentText}>lisäkulut</Text>
              <TouchableOpacity style={styles.dropdownButton} onPress={() => setShowAddedPrices(true)}>
                <Text style={styles.dropdownButtonText}>{addedPrices}</Text>
              </TouchableOpacity>
              {showAddedPrices && (
                <Modal
                  transparent={true}
                  animationType="fade"
                  onRequestClose={() => setShowAddedPrices(false)}
                >
                  <Pressable 
                    style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)'}}
                    onPress={() => {setShowAddedPrices(false)}}
                  >
                    <View style={styles.inputContainer}>
                      <TextInput
                        style={styles.input}
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
                      <Text style={styles.inputLabel}>c/kWh</Text>
                    </View>
                  </Pressable>
                </Modal>
              )}
            </View>
            
            <View style={styles.settingRow}>
              <Text style={styles.contentText}>palkkien määrä</Text>
                <TouchableOpacity 
                  style={styles.dropdownButton}
                  onPress={() => setShowZoomDropdown(!showZoomDropdown)}
                >
                  <Text style={styles.dropdownButtonText}>{zoom}</Text>
                </TouchableOpacity>
                {showZoomDropdown && (
                  <Modal 
                  transparent={true}
                  animationType="fade"
                  onRequestClose={() => {setShowZoomDropdown(false)}}
                  >
                    <Pressable 
                    style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)'}}
                    onPress={() => {setShowZoomDropdown(false)}}
                    >
                      <View style={styles.dropdownContainer}>
                        <FlatList
                          ListHeaderComponent={<View style={{height: 15}} />}
                          ListFooterComponent={<View style={{height: 15}} />}
                          data={zoomOptions}
                          keyExtractor={(item) => item.toString()}
                          renderItem={({ item }) => (
                            <TouchableOpacity onPress={() => { setZoom(item); AsyncStorage.setItem('zoom', JSON.stringify(item)); setShowZoomDropdown(false)}}>
                              <Text style={styles.dropdownItemText}>{item}</Text>
                            </TouchableOpacity>
                          )}
                          showsVerticalScrollIndicator={false}
                        />
                      </View>
                    </Pressable>
                  </Modal>
                )}
            </View>
            <View style={styles.settingRow}>
              <Text style={styles.contentText}>palkkien värit</Text>
              <View style={{flexDirection: 'row', gap: 15}}>
              {values.map((value, index) => (
                <View key={index}>{renderColorButton(index)}</View>
              ))}
              {changeValues && (
                <Modal
                  transparent={true}
                  animationType="fade"
                  onRequestClose={() => setChangeValues(false)}
                >
                  <Pressable
                    style={{
                      flex: 1,
                      justifyContent: 'center',
                      alignItems: 'center',
                      backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    }}
                    onPress={() => setChangeValues(false)}
                  >
                    <View style={styles.inputContainer}>
                      <TextInput
                        style={styles.input}
                        value={tempValue}
                        onChangeText={(text) => {
                          if (/^\d*\.?\d*$/.test(text)) {
                            setTempValue(text);
                          }
                        }}
                        keyboardType="decimal-pad"
                        placeholder=""
                        placeholderTextColor="#ccc"
                        selectTextOnFocus={true}
                        cursorColor="#101012"
                        maxLength={6}
                        autoFocus={true}
                        returnKeyType="done"
                        onSubmitEditing={() => {
                          if (selectedIndex !== null) {
                            const newValues = [...values];
                            newValues[selectedIndex] = parseFloat(tempValue) || 0;
                            setValues(newValues);
                            AsyncStorage.setItem('userValues', JSON.stringify(newValues)); 
                          }
                          setChangeValues(false);
                        }}
                      />
                      <Text style={styles.inputLabel}>c/kWh</Text>
                    </View>
                  </Pressable>
                </Modal>
              )}
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  priceContainer: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  timeText: {
    color: '#fff',
    fontSize: 14,
    marginTop: 3,
    fontWeight: 900,
  },
  shownPrice: {
    color: '#fff',
    fontSize: 60,
    fontWeight: 900,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
  },
  settingsContainer: {
    backgroundColor: '#2e2e2e',
    padding: 30,
    width: '100%',
    height: '50%',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.25,
    shadowRadius: 4,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
    borderBottomWidth: 1,
    paddingBottom: 30,
    borderColor: 'grey',
  },
  headerText: {
    color: '#ccc',
    fontSize: 20,
    fontWeight: 900,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  contentText: {
    fontSize: 16,
    fontWeight: 700,
    color: '#ccc',
  },
  settingsButton: {
    position: 'absolute',
    top: 0,
    right: 0,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderCurve: 'circular',
    zIndex: 1000,
  },
  dropdownButton: {
    backgroundColor: '#ccc',
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: 50,
    height: 30,
    gap: 8,
  },
  dropdownButtonText: {
    color: '#101012',
    fontSize: 14,
    fontWeight: 700,
  },
  dropdownContainer: {
    backgroundColor: '#ccc',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#ccc',
    maxHeight: 250,
    width: 100,
    zIndex: 1000,
  },
  dropdownItemText: {
    marginVertical: 10,
    color: '#101012',
    fontSize: 14,
    fontWeight: 700,
    textAlign: 'center',
  },
  inputContainer: {
    backgroundColor: '#ccc',
    borderRadius: 15,
    padding: 20,
    width: '80%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  input: {
    color: '#101012',
    fontSize: 24,
    fontWeight: 700,
    textAlign: 'center',
    width: 100,
  },
  inputLabel: {
    color: '#101012',
    fontSize: 16,
    fontWeight: 700,
  },
});