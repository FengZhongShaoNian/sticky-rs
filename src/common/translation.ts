import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import resources from 'virtual:i18next-loader'

i18n.use(LanguageDetector)
    .init({
        resources: {
            en: { translation: resources.en },
            zh: { translation: resources['zh-cn'] },
        },
        fallbackLng: 'en',
        debug: true,
    });

export { i18n };