import i18n from 'i18next'
import resources from 'virtual:i18next-loader'

i18n.init({
    lng: navigator.language.toLowerCase(),
    resources: {
        en: {translation: resources.en},
        zh: {translation: resources['zh-cn']},
    },
    fallbackLng: 'en',
    debug: true,
});

export {i18n};