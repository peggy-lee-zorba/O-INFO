/**
 * FileSystem Storage Module
 * Управляет хранением данных в файловой системе браузера
 * Использует File System Access API с fallback на LocalStorage
 */

class FileStorage {
    constructor() {
        this.instructionsDir = 'instructions';
        this.imagesDir = 'images';
        this.metadataFile = 'metadata.json';
        this.currentDirHandle = null;
        this.isFileSystemAccessSupported = 'showDirectoryPicker' in window;
    }

    // Инициализация файловой системы
    async init() {
        if (this.isFileSystemAccessSupported) {
            try {
                // Запрашиваем разрешение на доступ к файловой системе
                this.currentDirHandle = await window.showDirectoryPicker();
                return true;
            } catch (error) {
                console.warn('File System Access API недоступен, используем fallback:', error);
                return false;
            }
        }
        return false;
    }

    // Получение или создание директории
    async getDirectoryHandle(name, create = true) {
        if (!this.currentDirHandle) {
            return null;
        }

        try {
            return await this.currentDirHandle.getDirectoryHandle(name, { create });
        } catch (error) {
            console.error(`Ошибка получения директории ${name}:`, error);
            return null;
        }
    }

    // Создание файла
    async createFile(fileName, content, directory = 'instructions') {
        if (!this.currentDirHandle) {
            return this.fallbackCreateFile(fileName, content, directory);
        }

        try {
            const dirHandle = await this.getDirectoryHandle(directory);
            if (!dirHandle) {
                throw new Error(`Директория ${directory} не найдена`);
            }

            const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(content);
            await writable.close();

            return true;
        } catch (error) {
            console.error(`Ошибка создания файла ${fileName}:`, error);
            return this.fallbackCreateFile(fileName, content, directory);
        }
    }

    // Чтение файла
    async readFile(fileName, directory = 'instructions') {
        if (!this.currentDirHandle) {
            return this.fallbackReadFile(fileName, directory);
        }

        try {
            const dirHandle = await this.getDirectoryHandle(directory);
            if (!dirHandle) {
                throw new Error(`Директория ${directory} не найдена`);
            }

            const fileHandle = await dirHandle.getFileHandle(fileName);
            const file = await fileHandle.getFile();
            return await file.text();
        } catch (error) {
            console.error(`Ошибка чтения файла ${fileName}:`, error);
            return this.fallbackReadFile(fileName, directory);
        }
    }

    // Получение списка файлов в директории
    async getFileList(directory = 'instructions') {
        if (!this.currentDirHandle) {
            return this.fallbackGetFileList(directory);
        }

        try {
            const dirHandle = await this.getDirectoryHandle(directory);
            if (!dirHandle) {
                return [];
            }

            const files = [];
            for await (const [name, handle] of dirHandle.entries()) {
                if (handle.kind === 'file') {
                    files.push(name);
                }
            }
            return files;
        } catch (error) {
            console.error(`Ошибка получения списка файлов из ${directory}:`, error);
            return this.fallbackGetFileList(directory);
        }
    }

    // Удаление файла
    async deleteFile(fileName, directory = 'instructions') {
        if (!this.currentDirHandle) {
            return this.fallbackDeleteFile(fileName, directory);
        }

        try {
            const dirHandle = await this.getDirectoryHandle(directory);
            if (!dirHandle) {
                throw new Error(`Директория ${directory} не найдена`);
            }

            await dirHandle.removeEntry(fileName);
            return true;
        } catch (error) {
            console.error(`Ошибка удаления файла ${fileName}:`, error);
            return this.fallbackDeleteFile(fileName, directory);
        }
    }

    // FALLBACK: Работа с LocalStorage как эмуляцией файлов
    fallbackCreateFile(fileName, content, directory) {
        try {
            const key = `${directory}:${fileName}`;
            localStorage.setItem(key, content);
            this.updateFallbackMetadata(directory, fileName, 'create');
            return true;
        } catch (error) {
            console.error('Fallback создание файла не удалось:', error);
            return false;
        }
    }

    fallbackReadFile(fileName, directory) {
        try {
            const key = `${directory}:${fileName}`;
            return localStorage.getItem(key);
        } catch (error) {
            console.error('Fallback чтение файла не удалось:', error);
            return null;
        }
    }

    fallbackGetFileList(directory) {
        try {
            const files = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(`${directory}:`)) {
                    files.push(key.substring(directory.length + 1));
                }
            }
            return files;
        } catch (error) {
            console.error('Fallback получение списка файлов не удалось:', error);
            return [];
        }
    }

    fallbackDeleteFile(fileName, directory) {
        try {
            const key = `${directory}:${fileName}`;
            localStorage.removeItem(key);
            this.updateFallbackMetadata(directory, fileName, 'delete');
            return true;
        } catch (error) {
            console.error('Fallback удаление файла не удалось:', error);
            return false;
        }
    }

    // Обновление метаданных для fallback режима
    updateFallbackMetadata(directory, fileName, action) {
        const metadataKey = `fallback_metadata_${directory}`;
        let metadata = JSON.parse(localStorage.getItem(metadataKey) || '{}');
        
        if (action === 'create') {
            metadata[fileName] = new Date().toISOString();
        } else if (action === 'delete') {
            delete metadata[fileName];
        }
        
        localStorage.setItem(metadataKey, JSON.stringify(metadata));
    }

    // Экспорт всех данных (для бэкапа)
    async exportAll() {
        try {
            if (!this.currentDirHandle) {
                return this.fallbackExportAll();
            }

            const exportData = {
                instructions: [],
                images: [],
                metadata: {
                    exportDate: new Date().toISOString(),
                    version: '1.0'
                }
            };

            // Экспорт инструкций
            const instructionFiles = await this.getFileList('instructions');
            for (const fileName of instructionFiles) {
                const content = await this.readFile(fileName, 'instructions');
                exportData.instructions.push({
                    fileName,
                    content,
                    id: fileName.replace('.html', ''),
                    groupId: this.extractGroupId(fileName),
                    name: this.extractNameFromContent(content),
                    created: await this.getFileModifiedTime(fileName, 'instructions')
                });
            }

            // Экспорт изображений
            const imageFiles = await this.getFileList('images');
            for (const fileName of imageFiles) {
                exportData.images.push({
                    fileName,
                    url: await this.getImageURL(fileName),
                    created: await this.getFileModifiedTime(fileName, 'images')
                });
            }

            return exportData;
        } catch (error) {
            console.error('Ошибка экспорта данных:', error);
            return null;
        }
    }

    fallbackExportAll() {
        const exportData = {
            instructions: [],
            images: [],
            metadata: {
                exportDate: new Date().toISOString(),
                version: '1.0'
            }
        };

        // Экспорт из fallback хранилища
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('instructions:')) {
                const fileName = key.substring('instructions:'.length);
                exportData.instructions.push({
                    fileName,
                    content: localStorage.getItem(key),
                    id: fileName.replace('.html', ''),
                    groupId: this.extractGroupId(fileName),
                    name: this.extractNameFromContent(localStorage.getItem(key))
                });
            } else if (key && key.startsWith('images:')) {
                const fileName = key.substring('images:'.length);
                exportData.images.push({
                    fileName,
                    url: localStorage.getItem(key),
                    created: new Date().toISOString()
                });
            }
        }

        return exportData;
    }

    // Вспомогательные методы
    extractGroupId(fileName) {
        const match = fileName.match(/^([^-]+)-/);
        return match ? match[1] : 'general';
    }

    extractNameFromContent(content) {
        const titleMatch = content.match(/<title>([^<]*)<\/title>/i);
        if (titleMatch) return titleMatch[1];
        
        const h1Match = content.match(/<h1[^>]*>([^<]*)<\/h1>/i);
        if (h1Match) return h1Match[1];
        
        return 'Безымянная инструкция';
    }

    async getFileModifiedTime(fileName, directory) {
        // В реальном приложении здесь была бы информация о времени модификации
        return new Date().toISOString();
    }

    async getImageURL(fileName) {
        if (this.currentDirHandle) {
            try {
                const dirHandle = await this.getDirectoryHandle('images');
                const fileHandle = await dirHandle.getFileHandle(fileName);
                const file = await fileHandle.getFile();
                return URL.createObjectURL(file);
            } catch (error) {
                console.error('Ошибка получения URL изображения:', error);
                return null;
            }
        } else {
            // Fallback режим
            return localStorage.getItem(`images:${fileName}`);
        }
    }
}

// Создаем глобальный экземпляр
window.fileStorage = new FileStorage();
