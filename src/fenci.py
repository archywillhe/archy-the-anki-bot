import jieba
import jieba.posseg as pseg
import sys
import json

cjk_ranges = [
        ( 0x4E00,  0x62FF),
        ( 0x6300,  0x77FF),
        ( 0x7800,  0x8CFF),
        ( 0x8D00,  0x9FCC),
        ( 0x3400,  0x4DB5),
        (0x20000, 0x215FF),
        (0x21600, 0x230FF),
        (0x23100, 0x245FF),
        (0x24600, 0x260FF),
        (0x26100, 0x275FF),
        (0x27600, 0x290FF),
        (0x29100, 0x2A6DF),
        (0x2A700, 0x2B734),
        (0x2B740, 0x2B81D),
        (0x2B820, 0x2CEAF),
        (0x2CEB0, 0x2EBEF),
        (0x2F800, 0x2FA1F)
    ]

def is_cjk(char):
    char = ord(char)
    for bottom, top in cjk_ranges:
        if char >= bottom and char <= top:
            return True
    return False

if __name__ == "__main__":
    text = ""
    with open(sys.argv[1]+".txt") as file:
        text = file.read().replace('\n','')
    print("text received:" + text)
    jieba.enable_paddle()
    obj = pseg.cut(text, use_paddle=True)
    results = []

    {"words":[],"flags":[],"others":[]}
    for word, flag in obj:
        containChinese = any(map(is_cjk, word))
        if(containChinese):
            wword = filter(is_cjk, word)
            print(wword)
            results = results + [{"word":word,"flag":flag}]
        else:
            results = results + [{"word":word,"flag":"0"}]
    with open(sys.argv[1]+'.json', 'w') as outfile:
        json.dump(results, outfile, ensure_ascii=False )
