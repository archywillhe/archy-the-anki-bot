import sys
import json
import pinyin #https://pypi.org/project/pinyin/ by lxyu
import pinyin.cedict # from the CC-CE-DICT project (https://cc-cedict.org/wiki/)

if __name__ == "__main__":
    word = sys.argv[1]
    py = pinyin.get(word)
    meaning = pinyin.cedict.translate_word(word)
    # print(meaning)
    output = {"word":word,"meaning":(meaning or ["unknown"]),"pinyin":py}
    print(json.dumps(output))
