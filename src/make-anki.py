import sys
import json
import genanki

model = genanki.Model(
  420420420419,
  'Simple Model',
  fields=[
    {'name': 'ChinesePhrase'},
    {'name': 'Info'},
  ],
  templates=[
    {
      'name': 'Chinese Card with Pinyin & Defintion',
      'qfmt': '{{ChinesePhrase}}',
      'afmt': '{{FrontSide}}<hr id="answer" />{{Info}}',
    },
  ])

def makeNote(a):
    return genanki.Note(
      model=model,
      fields=[a["word"], a["pinyin"]+"<br /><br />"+", ".join(a["meaning"])])

if __name__ == "__main__":
    jsons = []
    with open(sys.argv[1]+"-cards.json") as file:
        jsons = json.load(file)
    deck = genanki.Deck(
      420420420,
      'ArchyShuo Test Desk')
    notes = list(map(makeNote,jsons))
    deck.notes = notes
    print(notes)
    genanki.Package(deck).write_to_file('files/test-cards.apkg')
