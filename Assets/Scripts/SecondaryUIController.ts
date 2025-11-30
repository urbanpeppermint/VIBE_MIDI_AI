import { ScrollWindow } from "SpectaclesUIKit.lspkg/Scripts/Components/ScrollWindow/ScrollWindow";
import { VibesData } from "Data/VibesData";
import { GenresData } from "Data/GenresData";
import { InstrumentsData } from "Data/InstrumentsData";
import { Adder } from "./Adder";
import { RoundButton } from "SpectaclesUIKit.lspkg/Scripts/Components/Button/RoundButton";
import { RectangleButton } from "SpectaclesUIKit.lspkg/Scripts/Components/Button/RectangleButton";
import WorldCameraFinderProvider from "SpectaclesInteractionKit.lspkg/Providers/CameraProvider/WorldCameraFinderProvider";
import animate from "SpectaclesInteractionKit.lspkg/Utils/animate";
import { SelectionController } from "./SelectionController";
import { CategoryButtonStyler } from "./CategoryButtonStyler";

@component
export class SecondaryUIController extends BaseScriptComponent {
  @input
  private _mainPage: SceneObject;
  @input
  private _detailsPage: SceneObject;

  @input
  private _adderPrefab: ObjectPrefab;

  @input
  private _scrollWindow: ScrollWindow;

  @input
  private _categoryButtons: RectangleButton[];

  @input
  private _instrumentObj: SceneObject;

  @input
  private _summonButton: RoundButton;

  @input
  private _hintText: Text;

  @input
  private _parentObj: SceneObject;

  @input
  private _selectionController: SelectionController;

  private _vibesScrollDimensions: vec2;
  private _genresScrollDimensions: vec2;
  private _instrumentsScrollDimensions: vec2;

  private _vibesData: string[];
  private _vibesEmojis: string[];
  
  private _genresData: string[];
  private _genresEmojis: string[];
  
  private _instrumentsData: string[];
  private _instrumentsEmojis: string[];

  private _adders: SceneObject[] = [];
  private _currentCategory: string = "";
  private _itemSpacing: number = 5;
  private _rowSpacing: number = 8;
  private _initialOffset: number = 2;

  private _selectedVibe: string = "";
  private _lockedCategory: string = "";
  private readonly MIN_ITEMS: number = 2;
  private readonly MAX_ITEMS: number = 10;

  private _vibeBPM: { [key: string]: number } = {
    "Nature": 85, "Medieval": 75, "Upbeat": 120, "Chill": 80,
    "Energetic": 128, "Melancholic": 70, "Dreamy": 75, "Epic": 90,
    "Mysterious": 85, "Romantic": 72, "Nostalgic": 88, "Futuristic": 118,
    "Peaceful": 65, "Intense": 140, "Ethereal": 70, "Urban": 95,
    "Tropical": 100, "Dramatic": 85, "Playful": 110, "Inspirational": 92,
    "Cinematic": 80, "Funky": 105, "Retro": 115, "Ambient": 60,
    "Dark": 78, "Festive": 125, "Soothing": 65, "Whimsical": 108,
    "Elegant": 76, "Suspenseful": 82
  };

  onAwake() {
    this.createEvent("OnStartEvent").bind(() => {
      this._scrollWindow.initialize();
      this._initializeScrolls();
      
      this._categoryButtons.forEach((button) => {
        button.onInitialized.add(() => {
          button.onTriggerUp.add((event) => {
            let title = button
              .getSceneObject()
              .getChild(0)
              .getComponent("Text").text;
            this._handleCategoryClick(title);
          });
        });
      });
      
      this._openMainPage();
      this._selectScrollCategory("Vibes");
      this._updateHintText();
      this._autoPositionMenu();

      this._summonButton.onInitialized.add(() => {
        this._summonButton.onTriggerUp.add(() => {
          this._autoPositionMenu();
        });
      });
    });
  }

  private _initializeScrolls() {
    const vibesDataObj = new VibesData();
    this._vibesData = vibesDataObj.vibes;
    this._vibesEmojis = vibesDataObj.emojis;
    
    const genresDataObj = new GenresData();
    this._genresData = genresDataObj.genres;
    this._genresEmojis = genresDataObj.emojis;
    
    const instrumentsDataObj = new InstrumentsData();
    this._instrumentsData = instrumentsDataObj.instruments;
    this._instrumentsEmojis = instrumentsDataObj.emojis;

    const maxItems = Math.max(
      this._vibesData.length,
      this._genresData.length,
      this._instrumentsData.length
    );

    const vibesItemsPerRow = Math.ceil(this._vibesData.length / 2);
    const genresItemsPerRow = Math.ceil(this._genresData.length / 2);
    const instrumentsItemsPerRow = Math.ceil(this._instrumentsData.length / 2);

    const vibesWidth = Math.max(
      this._scrollWindow.getScrollDimensions().x,
      vibesItemsPerRow * this._itemSpacing + this._initialOffset
    );
    const genresWidth = Math.max(
      this._scrollWindow.getScrollDimensions().x,
      genresItemsPerRow * this._itemSpacing + this._initialOffset
    );
    const instrumentsWidth = Math.max(
      this._scrollWindow.getScrollDimensions().x,
      instrumentsItemsPerRow * this._itemSpacing + this._initialOffset
    );

    const scrollHeight = this._scrollWindow.getScrollDimensions().y;
    this._vibesScrollDimensions = new vec2(vibesWidth, scrollHeight);
    this._genresScrollDimensions = new vec2(genresWidth, scrollHeight);
    this._instrumentsScrollDimensions = new vec2(instrumentsWidth, scrollHeight);

    for (let i = 0; i < maxItems; i++) {
      let adder = this._adderPrefab.instantiate(this._instrumentObj);
      let adderComponent = adder.getComponent(Adder.getTypeName());
      adderComponent.addSelectionController(this._selectionController);
      this._adders.push(adder);
      adder.enabled = false;
    }
  }

  private _handleCategoryClick(category: string) {
    if (this._selectedVibe === "" && category !== "Vibes") {
      this._updateHintText("⚠️ Select a Vibe first!");
      this._openDetailsPage("Vibes");
      return;
    }

    if ((category === "Genres" || category === "Instruments") && 
        this._lockedCategory !== "" && 
        this._lockedCategory !== category) {
      this._updateHintText("⚠️ Clear " + this._lockedCategory + " first");
      return;
    }

    this._openDetailsPage(category);
  }

  private _autoPositionMenu() {
    let posInFrontOfUser = WorldCameraFinderProvider.getInstance().getForwardPosition(100);
    let parentTransform = this._parentObj.getTransform();
    const from = parentTransform.getWorldPosition();
    const to = posInFrontOfUser.add(vec3.down().uniformScale(80));

    animate({
      duration: 0.5,
      easing: "ease-out-back-cubic",
      update: (t: number) => {
        const nx = from.x + (to.x - from.x) * t;
        const ny = from.y + (to.y - from.y) * t;
        const nz = from.z + (to.z - from.z) * t;
        parentTransform.setWorldPosition(new vec3(nx, ny, nz));
      },
    });
  }

  private _openMainPage() {
    this._mainPage.enabled = true;
  }

  private _openDetailsPage(title: string) {
    this._scrollWindow.scrollPositionNormalized = new vec2(-1, 0);
    this._detailsPage.enabled = true;
    this._selectScrollCategory(title);
  }

  private _selectScrollCategory(category: string) {
    if (this._currentCategory === category) return;
    this._currentCategory = category;

    if (category === "Vibes") {
      this._scrollWindow.setScrollDimensions(this._vibesScrollDimensions);
      this._updateAdders(this._vibesData, this._vibesEmojis, Math.ceil(this._vibesData.length / 2));
    } else if (category === "Genres") {
      this._scrollWindow.setScrollDimensions(this._genresScrollDimensions);
      this._updateAdders(this._genresData, this._genresEmojis, Math.ceil(this._genresData.length / 2));
    } else if (category === "Instruments") {
      this._scrollWindow.setScrollDimensions(this._instrumentsScrollDimensions);
      this._updateAdders(this._instrumentsData, this._instrumentsEmojis, Math.ceil(this._instrumentsData.length / 2));
    }

    this._updateHintText();
  }

  private _updateAdders(data: string[], emojis: string[], itemsPerRow: number) {
    this._adders.forEach((adder) => (adder.enabled = false));

    const width = Math.max(
      this._scrollWindow.getScrollDimensions().x,
      itemsPerRow * this._itemSpacing + this._initialOffset
    );

    const midiSymbols: { [key: string]: string } = {
      "knob": "◎",
      "slider": "║",
      "button": "▣",
      "pad": "●"
    };

    for (let i = 0; i < data.length; i++) {
      if (i >= this._adders.length) break;

      const adder = this._adders[i];
      adder.enabled = true;

      const row = Math.floor(i / itemsPerRow);
      const col = i % itemsPerRow;

      adder.getTransform().setLocalPosition(
        new vec3(
          col * this._itemSpacing - width / 2 + this._initialOffset,
          -1 - row * this._rowSpacing,
          0
        )
      );

      const adderComponent = adder.getComponent(Adder.getTypeName());
      const controlType = CategoryButtonStyler.getControlTypeForIndex(i);
      const symbol = midiSymbols[controlType] || emojis[i];
      
      adderComponent.init(data[i], symbol);
    }
  }

  private _updateHintText(customMessage?: string) {
    if (!this._hintText) return;

    if (customMessage) {
      this._hintText.text = customMessage;
      return;
    }

    if (this._selectedVibe === "") {
      this._hintText.text = "◎ STEP 1: SELECT VIBE [CH16]";
    } else {
      const itemCount = this._selectionController ? this._selectionController.getItemCount() : 0;
      const vibeItemCount = this._selectedVibe ? 1 : 0;
      const actualItemCount = itemCount - vibeItemCount;
      
      if (actualItemCount === 0) {
        this._hintText.text = "║ STEP 2: LOAD 2-10 CONTROLS\n" +
          "▣ GENRES [CH1-5] OR ● INSTRUMENTS [CH1-4]\n" +
          "◎ VIBE: " + this._selectedVibe.toUpperCase() + " @ " + this.getBPMForVibe() + " BPM";
      } else {
        const status = actualItemCount >= this.MIN_ITEMS ? "▶ READY" : "◁ NEED " + (this.MIN_ITEMS - actualItemCount);
        const controlSymbol = this._lockedCategory === "Genres" ? "▣" : "●";
        this._hintText.text = controlSymbol + " " + this._lockedCategory.toUpperCase() + ": " + 
          actualItemCount + "/" + this.MAX_ITEMS + " " + status + "\n" +
          "◎ VIBE: " + this._selectedVibe.toUpperCase() + " @ " + this.getBPMForVibe() + " BPM";
      }
    }
  }

  public getCurrentCategory(): string {
    return this._currentCategory;
  }

  public getBPMForVibe(): number {
    return this._vibeBPM[this._selectedVibe] || 90;
  }

  public getSelectedVibe(): string {
    return this._selectedVibe;
  }

  public getLockedCategory(): string {
    return this._lockedCategory;
  }

  public setSelectedVibe(vibe: string) {
    this._selectedVibe = vibe;
    this._updateHintText();
  }

  public clearVibe() {
    this._selectedVibe = "";
    this._updateHintText();
  }

  public lockCategory(category: string) {
    this._lockedCategory = category;
    this._updateHintText();
  }

  public unlockCategory() {
    this._lockedCategory = "";
    this._updateHintText();
  }

  public canAddItem(category: string): boolean {
    if (this._lockedCategory !== "" && this._lockedCategory !== category) {
      return false;
    }
    
    const currentCount = this._selectionController ? this._selectionController.getItemCount() : 0;
    const vibeCount = this._selectedVibe ? 1 : 0;
    return (currentCount - vibeCount) < this.MAX_ITEMS;
  }

  public refreshHint() {
    this._updateHintText();
  }
}