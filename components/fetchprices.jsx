import AsyncStorage from '@react-native-async-storage/async-storage';

const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}/${month}-${day}`;
};

export const getDateStrings = () => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  return {
    today,
    isAfterTwoPM: today.getHours() >= 14,
    todayStr: formatDate(today),
    yesterdayStr: formatDate(yesterday),
    tomorrowStr: formatDate(tomorrow),
  };
};

const fetchPriceForDate = async (dateStr) => {
  const response = await fetch(`https://www.sahkonhintatanaan.fi/api/v1/prices/${dateStr}.json`);
  if (!response.ok) {
    throw new Error(`Failed to fetch data for ${dateStr}`);
  }
  return response.json();
};

export const checkAndFetchPrices = async () => {
  try {
    const storedPricesRaw = await AsyncStorage.getItem('prices');
    const storedPrices = storedPricesRaw ? JSON.parse(storedPricesRaw) : {};

    const {
      today,
      isAfterTwoPM,
      yesterdayStr,
      todayStr,
      tomorrowStr,
    } = getDateStrings();

    const requiredDates = [yesterdayStr, todayStr];
    if (isAfterTwoPM) requiredDates.push(tomorrowStr);

    const missingDates = requiredDates.filter((date) => !(date in storedPrices));

    if (missingDates.length > 0) {
      console.log('Fetching new prices...');

      const fetchPromises = missingDates.map(async (dateStr) => {
        try {
          const data = await fetchPriceForDate(dateStr);
          return { [dateStr]: data };
        } catch (err) {
          console.warn(`Fetch failed for ${dateStr}:`, err.message);
          return null; // Gracefully fail
        }
      });

      const results = await Promise.all(fetchPromises);
      const successfulResults = results.filter(Boolean); // remove nulls

      const newPrices = successfulResults.reduce((acc, cur) => ({ ...acc, ...cur }), {});

      const keepDates = [yesterdayStr, todayStr];
      if (isAfterTwoPM) keepDates.push(tomorrowStr);

      const cleanedStoredPrices = Object.fromEntries(
        Object.entries(storedPrices).filter(([date]) => keepDates.includes(date))
      );

      const updatedPrices = { ...cleanedStoredPrices, ...newPrices };
      await AsyncStorage.setItem('prices', JSON.stringify(updatedPrices));

      return updatedPrices;
    }

    return storedPrices;

  } catch (error) {
    console.error('Error checking prices:', error);
    return {};
  }
};
